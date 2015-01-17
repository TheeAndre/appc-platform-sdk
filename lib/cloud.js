/**
 * This source code is the intellectual property of Appcelerator, Inc.
 * Copyright (c) 2014-2015 Appcelerator, Inc. All Rights Reserved.
 * See the LICENSE file distributed with this package for
 * license restrictions and information about usage and distribution.
 */
var async = require('async'),
	request = require('appc-request-ssl'),
	urllib = require('url'),
	AppC = require('./index'),
	debug = require('debug')('appc:sdk');

function Cloud() {
}

function createCloudResponseHandler(callback) {
	return function(err,response,body) {
		debug('cloud response received, err=%o, body=%o',err,body);
		if (err) { return callback(err); }
		if (response.statusCode!==200) {
			try {
				body = JSON.parse(body);
			}
			catch (E) {
			}
			return callback(body.meta && body.meta.message || 'Server error');
		}
		if (body) {
			try {
				body = JSON.parse(body);
			}
			catch (E) {
				return callback(E);
			}
			if (body.meta && body.meta.status==="ok") {
				return callback(null, body);
			}
		}
		return callback(new Error('Unknown error. '+body));
	};
}

/**
 * login to ACS backend using Platform session
 */
function login(session, callback) {
	var url = Cloud.getEnvironment(session) + '/v1/admins/login360.json?ct=enterprise&connect.sid='+session.id;
	debug('acs login %s',url);
	request(AppC.createRequestObject(session,url), createCloudResponseHandler(function(err,body){
		if (!err) {
			session.acs_session = body.meta.session_id;
		}
		return callback(err);
	}));
}

/**
 * create a named cloud ACS app (pre-built services)
 *
 * @param {Object} session
 * @param {String} name application name
 * @param {Function} callback
 */
Cloud.createNamedApp = function createNamedApp(session, name, callback) {
	var tasks = [],
		apps;

	if (!session.acs_session) {
		tasks.push(function(next){
			login(session, next);
		});
	}

	tasks.push(function(next){
		var url = Cloud.getEnvironment(session) + '/v1/apps/create.json?_session_id='+session.acs_session+'&ct=enterprise';
		var r = request.post(AppC.createRequestObject(session,url), createCloudResponseHandler(function(err,body){
			if (err) { return next(err); }
			apps = body.response.apps;
			if (!apps || apps.length===0) {
				return next(new Error("couldn't create cloud application. please retry again."));
			}
			next();
		}));
		var form = r.form();
		form.append('name',name);
		debug('form parameters for %s, %o',url,form);
	});

	tasks.push(function(next){
		async.each(apps, function(app,cb){
			var url = urllib.resolve(AppC.baseurl, '/api/v1/api'),
				obj = AppC.createRequestObject(session, url),
				req = request.post(obj, createACSResponseHandler('apps',function(err,result){
					if (err) { return next(err); }
					if (result.length===0) {
						return next(new Error("no applications created. please re-try your request again."));
					}
					app.dashboard = result;
					console.log('set',app);
					cb();
				})),
				form = req.form();

			form.append('name', name);
			form.append('id', app.id);
			form.append('type', 'data');
			form.append('org_id', session.user.org_id);
			debug('form parameters for %s, %o',url,form);
		},function(err){
			if (err) { return next(err); }
			callback(null, apps);
		});
	});

	async.series(tasks, function(err){
		if (err) { return callback(err); }
	});
};

function createACSResponseHandler(key, callback) {
	return AppC.createAPIResponseHandler(function(err,body) {
		if (err) { return callback(err); }
		if (body) {
			var found;
			if (body.meta && body.meta.code === 200 && body.response) {
				found = body.response[key];
				if (found) {
					// if we have a one entry array, just return the entry
					return callback(null, Array.isArray(found) && found.length===1 ? found[0] : found);
				}
			}
			if (key in body) {
				found = body[key];
				// if we have a one entry array, just return the entry
				return callback(null, Array.isArray(found) && found.length===1 ? found[0] : found);
			}
			return callback(null, body);
		}
		return callback();
	});
}

/**
 * create a new cloud app for a given application (returns an array of apps, one for each environment)
 *
 * @param {Object} session
 * @param {String} name of the app
 * @param {String} app_guid application guid
 * @param {Function} callback
 */
Cloud.createApp = function createApp (session, app_name, org_id, app_guid, callback) {
	if (typeof(org_id) === 'function') {
		callback = org_id;
		app_guid = null;
		org_id = session.user.org_id;
	}
	if (typeof(app_guid) === 'function') {
		callback = app_guid;
		app_guid = null;
	}
	var url = urllib.resolve(AppC.baseurl, '/api/v1/acs'),
		obj = AppC.createRequestObject(session, url),
		req = request.post(obj, createACSResponseHandler('apps',callback)),
		form = req.form();

	if (app_guid) {
		form.append('app_guid', app_guid);
	}
	if (app_name) {
		form.append('app_name',app_name);
	}
	form.append('org_id',''+org_id);
	debug('form parameters for %s, %o',url,form);
};

/**
 * create an ACS cloud user
 *
 * @param {Object} session
 * @param {String} app_guid application guid
 * @param {Object} keyvalues object of the properties to pass to create
 * @param {Function} callback
 */
Cloud.createUser = function createUser (session, app_guid, keyvalues, callback) {
	var url = urllib.resolve(AppC.baseurl, '/api/v1/acs/'+app_guid+'/data.next/user'),
		obj = AppC.createRequestObject(session, url),
		req = request.post(obj, createACSResponseHandler('users',callback)),
		form = req.form();

	Object.keys(keyvalues).forEach(function(key){
		form.append(key, String(keyvalues[key]));
	});
	debug('form parameters for %s, %o',url,form);
};

Cloud.NODE_ACS = 'nodeACSEndpoint';
Cloud.ACS_BASE = 'acsBaseUrl';
Cloud.AUTH_BASE = 'acsAuthBaseUrl';

/**
 * return the appropriate environment url.
 *
 * @param {String} type is one of Cloud.NODE_ACS, Cloud.ACS_BASE or Cloud.AUTH_BASE
 * @param {String} name is one of production or development or another environment name
 */
Cloud.getEnvironment = function getEnvironment(session, type, name) {
	if (!session.user) {
		throw new Error("session is not valid. missing user");
	}
	if (!session.org && !session.user.org) {
		throw new Error("session is not valid. missing org");
	}
	session.org = session.org || session.user.org;
	type = type || Cloud.ACS_BASE;
	name = name || AppC.isProduction ? 'production' : 'development';
	return session.org.envs.filter(function(env){
		return env.name===name;
	})[0][type];
};

module.exports = Cloud;
