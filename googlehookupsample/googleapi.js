'use strict';

var https = require('https');
var reqObj = require('request');
var url = require('url');
var googleLocationApiPrefix = '/maps/api/geocode/json?address=';
var googleLocationApiKey = 'AIzaSyBtSeQ0D974ycFyruodUd5VE2IsXFUzbXc';
var googleLocationApiSuffix = '&key=' + googleLocationApiKey;
var storage = require('node-persist');
var sanitize = require('sanitize-filename');

var googleDirectionsApiPrefix = '/maps/api/directions/json?key=AIzaSyCj8I9K8V5fZAsRKYSabu5vu7ryVOh-D5Y&origin=';
var googleDirectionsApiMidfix = '&destination=';
var googleDirectionsApiSuffix = '&mode=';
var querystring = require('querystring');

//transit&transit_mode=bus transit&transit_mode=rail walking cycling driving


storage.initSync();

module.exports.googleapis = function() {

  return {
    'googleLocation' : function (address, callback) {


	var addrKey = sanitize((address || 'non'));
	console.log('Request for address: ' + address);
	var postheaders = {
		'Accept' : 'application/json'
	};
	var existingItem = storage.getItem(addrKey);
	if (existingItem !== undefined)
	{
		console.info('item cached\n' + JSON.stringify(existingItem));
		callback(existingItem);
	}
	else {
	var optionspost = {
		//protocol: 'https:',
		host: 'maps.googleapis.com',
		port: 443,
		path: googleLocationApiPrefix + querystring.escape(address) + googleLocationApiSuffix,
		method: 'GET',
		//query: { address: addr, key: googleApiKey}
		//,
		headers: postheaders
	};
	console.info('Options prepared:');
	console.info(optionspost);
	console.info('call google api');

	//var googleUrl = url.format(optionspost);
	//console.info(googleUrl);
	var strResponse = '';

	//response.on('pipe', (src) => {
	//	console.info('fetching output and caching');
	//	storage.setItem(addrKey,src);
	//});

	var reqObj = https.request(optionspost, function(resp){
		resp.on('data', function(chunk) {
			strResponse += chunk;
		});
		resp.on('end', function() {
			console.info(strResponse);
			var dataResult = JSON.parse(strResponse);

			storage.setItem(addrKey,dataResult);
      callback(dataResult);


		});
	});
	reqObj.on('error',function(err){console.error(err);});
	reqObj.end();
}
},
    'googleDirections' : function(origin, destination, options,callback) {


        // production code should not cache for directions service , caching here to prevent exceeding limits
        var nowDate = new Date();
      	var directionsKey = sanitize((origin || 'non') + (destination || 'non') + ((options || {}).mode || 'non') + ((options || {}).transitMode || '') + (nowDate.getFullYear() + nowDate.getDay() + nowDate.getHours() + nowDate.getMinutes() ));
      	console.log('Request for directions: ' + directionsKey);
      	var postheaders = {
      		'Accept' : 'application/json'
      	};
      	var existingItem = storage.getItem(directionsKey);
      	if (existingItem !== undefined)
      	{
      		console.info('item cached\n' + JSON.stringify(existingItem));
      		callback(existingItem);
      	}
      	else {
      	var optionspost = {
      		//protocol: 'https:',
      		host: 'maps.googleapis.com',
      		port: 443,
      		path: (googleDirectionsApiPrefix
            + querystring.escape(origin)
            + googleDirectionsApiMidfix
            + querystring.escape(destination)
            + googleDirectionsApiSuffix
            + ((options || {}).mode || 'driving')
            + ((((options || {}).transitMode || '') != '') ? ('&transit_mode=' + options.transitMode) : '' ))  ,
      		method: 'GET',
      		//query: { address: addr, key: googleApiKey}
      		//,
      		headers: postheaders
      	};
      	console.info('Options prepared:');
      	console.info(optionspost);
      	console.info('call google api');

      	//var googleUrl = url.format(optionspost);
      	//console.info(googleUrl);
      	var strResponse = '';

      	//response.on('pipe', (src) => {
      	//	console.info('fetching output and caching');
      	//	storage.setItem(addrKey,src);
      	//});

      	var reqObj = https.request(optionspost, function(resp){
      		resp.on('data', function(chunk) {
      			strResponse += chunk;
      		});
      		resp.on('end', function() {
      			console.info(strResponse);
      			var dataResult = JSON.parse(strResponse);

      			storage.setItem(directionsKey,dataResult);
            callback(dataResult);


      		});
      	});
      	reqObj.on('error',function(err){console.error(err);});
      	reqObj.end();
      }
    }
  };

};
