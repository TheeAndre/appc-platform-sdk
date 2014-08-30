# Appcelerator Platform SDK

This is a Node module that will allow you to make API requests to the Appcelerator Platform.

## Installation

	$ [sudo] npm install appc-platform-sdk

## Usage

	var AppC = require('appc-platform-sdk');

	// login
	AppC.login(username,password,function(err,session){
		// we got an error, oops
		if (err) return console.error(err);

		// print out some information about our logged in user
		console.log(session.user.username);
		
		// when you're done, logout
		AppC.logout(session);
	});

## Auth

Authentication API used for gaining access to the platform.

### Login

Login to the Platform.  Will validate the user and create a user session which will allow you to make subsequent API calls to the platform while the session is valid.

	AppC.login(username,password,function(err,session){
		// logged in, check err
	});

### Logout

Logout of the Platform session.  Will invalidate the session object.

	AppC.logout(session,function(){
		// logged out
	});


## Session

A new Session instance is created on a succesful login.  The following properties / functions are available:

| Property     | Type     | Description                             |
|--------------|----------|-----------------------------------------|
| isValid      | function | returns true if session is valid        |
| invalidate   | function | invalid (and logout) session            |
| user         | property | user instance                           |
| orgs         | property | user member orgs                        |

You cannot create a session and a session is immutable. Once you invalidate a session, it is no longer valid and must not be used again.

## User

User API for interacting with users of the platform.

### find

Find a specific user details.

	AppC.User.find(session, '1234', function(err, user){

	});

### switchLoggedInOrg

Switch the active session user's logged in / active organization.

	AppC.User.switchLoggedInOrg(session, '4567', function(err){

	});

## Org

Organization API for interacting with organizations that a user is a member.

### find

Find all the organizations that the current user has visibility.

	AppC.Org.find(session, function(err,orgs){

	});

### getCurrent

Return the current organization object for user session.

	AppC.Org.getCurrent(session);

### getById

Return a specific organization by the org_id.

	AppC.Org.getById(session, org_id);

### getByName

Return a specific organization by the name.

	AppC.Org.getByName(session, 'Org Name');


## App

App API for interacting with applications registered with the platform.

### findAll

Find all the apps that the current user has access to

	// find all apps for current active organization
	AppC.App.findAll(session, function(err,apps){

	});

	// find all apps for the org_id
	AppC.App.findAll(session, 'org_id', function(err,apps){

	});

### find

Find a specific app by app_guid

	// find a specific app
	AppC.App.find(session, 'app_guid', function(err,app){

	});

### update

Update an app details.
 
	// update an app
	app.app_name = 'my new app name';
	AppC.App.update(session, app, function(err,result){
		console.log(err,result);
	})

> this API is dangerous. please be cautious in using this API as changes are irreversible.

## Notification

Notification API for handling platform notification events.

### findAll

Find all notifications for the logged in user:

	// get all notifications
	AppC.Notification.findAll(session, function(err,results){

	});

## Feed

Feed API for handling platform feed events.

### findAll

Find all feed events for the logged in user:

	// get all feeds
	AppC.Feed.findAll(session, function(err,results){

	});

	// get all feeds for app_guid
	AppC.Feed.findAll(session, {app_guid:'123'}, function(err,results){

	});

	// get feeds by limit
	AppC.Feed.findAll(session, {limit:10}, function(err,results){

	});

The following are options that can be passed to the second parameter of findAll:

- org_id: The ID of the org that the messages were sent to
- app_guid: The guid of the app that the messages were sent to
- limit: A number of records to limit the result to
- since: A unix timestamp to get new messages from
- before: A unix timestamp to get old messages from before



# License

This software is Licensed under the Apache Public License (v2).  Access and usage of the Appcelerator Platform is governed separately under the Appcelerator Subscription Agreement. Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.

