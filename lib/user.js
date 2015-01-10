/**
 * This source code is the intellectual property of Appcelerator, Inc.
 * Copyright (c) 2014-2015 Appcelerator, Inc. All Rights Reserved.
 * See the LICENSE file distributed with this package for
 * license restrictions and information about usage and distribution.
 */

/**
 * make a request to AppC platform for fetching user information
 */
var request = require('request'),
	urllib = require('url'),
	AppC = require('./index');

function User() {
}

/**
 * find a specific user or if not user_id is supplied, the sessions logged
 * in user
 */
User.find = function find(session, user_id, callback) {
	if (typeof(user_id)==='function') {
		callback = user_id;
		if (session && session.user && session.user.guid) {
			user_id = session.user.guid;
		}
		else {
			user_id = 'current';
		}
	}
	var url = urllib.resolve(AppC.baseurl, '/api/v1/user/'+user_id);
	request.get(AppC.createRequestObject(session,url), AppC.createAPIResponseHandler(callback));
};

/**
 * switch the users logged in user
 */
User.switchLoggedInOrg = function switchLoggedInOrg(session, org_id, callback) {
	var org = AppC.Org.getById(session, org_id);
	if (!org) { return callback("Cannot find org_id: "+org_id); }
	var url = urllib.resolve(AppC.baseurl, '/api/v1/auth/switchLoggedInOrg'),
		next = AppC.createAPIResponseHandler(callback, function mapper(obj, next) {
			session.user.org = org;
			session.user.org_id = org_id;
			next(null,obj);
		}),
		r = request.post(AppC.createRequestObject(session,url), next),
		form = r.form();

	form.append('org_id',org_id);
};

module.exports = User;
