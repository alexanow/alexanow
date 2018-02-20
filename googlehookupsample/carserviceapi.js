'use string';

var https = require('https');
var querystring = require('querystring');
var uberApiKey = 'Token 5DlrY2RQDJ3yd_QQ9vsil1bd1BDV5oIzthF5fAib'
var uberUrl = '/v1/estimates/price'
var lyftUrl = 'https://api.lyft.com/oauth/token'


module.exports.carserviceapis = function(){
  return {
    'uberEstimate': function(startGeo, stopGeo, callback){

      console.log('startGeo: ' + JSON.stringify(startGeo));
      console.log('stopGeo: ' + JSON.stringify(stopGeo));
      if (!startGeo || startGeo.lat == null || startGeo.lng == null || !stopGeo || stopGeo.lat == null || stopGeo.lng == null){
        callback(null);
      }
      else {
        var uberObj = {
          'start_latitude': startGeo.lat,
          'start_longitude': startGeo.lng,
          'end_latitude': stopGeo.lat,
          'end_longitude': stopGeo.lng
        };

        var callUberUrl = uberUrl + '?start_latitude=' + uberObj.start_latitude + '&start_longitude=' + uberObj.start_longitude + '&end_latitude=' + uberObj.end_latitude + '&end_longitude=' + uberObj.end_longitude;

        console.info('request ', callUberUrl);
        var postheaders = {
          'Accept' : 'application/json',
          'Authorization': 'Token 5DlrY2RQDJ3yd_QQ9vsil1bd1BDV5oIzthF5fAib'
        };
        var optionspost = {
          host: 'api.uber.com',
          port: 443,
          path: callUberUrl,
          method: 'GET',
          headers: postheaders
        };

        var strResponse = '';
        	var reqObj = https.request(optionspost, function(resp){
        		resp.on('data', function(chunk) {
        			strResponse += chunk;
        		});
        		resp.on('end', function() {
        			console.info(strResponse);
        			var dataResult = JSON.parse(strResponse);
              callback(dataResult);
        		});
        	});
        	reqObj.on('error',function(err){console.error(err);});
        	reqObj.end();
      }
    },
    'lyftEstimate': function(startGeo, stopGeo, callback){
      console.info('call lyft api');
      console.log('startGeo: ' + JSON.stringify(startGeo));
      console.log('stopGeo: ' + JSON.stringify(stopGeo));
      if (!startGeo || startGeo.lat == null || startGeo.lng == null || !stopGeo || stopGeo.lat == null || stopGeo.lng == null){
        callback(null);
      }
      else {
        var lyftObj = {
          'start_latitude': startGeo.lat,
          'start_longitude': startGeo.lng,
          'end_latitude': stopGeo.lat,
          'end_longitude': stopGeo.lng
        };
      var lyftUrl = 'https://api.lyft.com/oauth/token'
      var postData = '{"grant_type": "client_credentials", "scope": "public"}';
      var options = {
        host: 'api.lyft.com',
        port: 443,
        path: '/oauth/token',
        headers: {
          'Authorization': 'Basic eUJCOUhCZHFCbW0zOjZ2QUxwQ1ZoY1pxbjhhZXY2bmZFeTd0cXJjdGFEckNw',
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        method: "POST"
      };

      var strResponse = '';
        var reqObj = https.request(options, function(resp){
          resp.on('data', function(chunk) {
            strResponse += chunk;
          });
          resp.on('end', function() {
            console.info(strResponse);

            if (resp.statusCode != 200){
              callback(null);
            }
            else {
              var dataResult = JSON.parse(strResponse);

              var moreOptions = {
                host: 'api.lyft.com'
                , port: 443
                , path: '/v1/drivers?lat=' + lyftObj.start_latitude + '&lng=' + lyftObj.start_longitude
                , method: 'GET'
                ,
                headers: {
                  'Authorization': 'Bearer ' + dataResult.access_token
                  , 'Accept': 'application/json'
                }
              }

              var strResponse2 = '';
              var reqObj2 = https.request(moreOptions, function(resp2){
                resp2.on('data',function(chunk2){
                  strResponse2 += chunk2;
                });
                resp2.on('end', function() {
                  console.info(strResponse2);

                  if (resp2.statusCode >= 305){
                    callback(null);
                  }
                  else {
                    console.info('callback from lyft with time ' + strResponse2)

                    var jsonresponse2 = JSON.parse(strResponse2);
                    callback(jsonresponse2);
                  }
                });
                resp2.on('error',function(err2){
                  console.error(err2);
                });
              });
              reqObj2.on('error',function(err){console.error(err);});
              reqObj2.end();
            }
          });
        });
        reqObj.write(postData);
        reqObj.on('error',function(err){console.error(err);});
        reqObj.end();
      }
    },
    'lyftDriversNearBy': function(startGeo, stopGeo, callback){
      console.info('call lyft api');
      console.log('startGeo: ' + JSON.stringify(startGeo));
      console.log('stopGeo: ' + JSON.stringify(stopGeo));
      if (!startGeo || startGeo.lat == null || startGeo.lng == null || !stopGeo || stopGeo.lat == null || stopGeo.lng == null){
        callback(null);
      }
      else {
        var lyftObj = {
          'start_latitude': startGeo.lat,
          'start_longitude': startGeo.lng,
          'end_latitude': stopGeo.lat,
          'end_longitude': stopGeo.lng
        };
      var lyftUrl = 'https://api.lyft.com/oauth/token'
      var postData = '{"grant_type": "client_credentials", "scope": "public"}';
      var options = {
        host: 'api.lyft.com',
        port: 443,
        path: '/oauth/token',
        headers: {
          'Authorization': 'Basic eUJCOUhCZHFCbW0zOjZ2QUxwQ1ZoY1pxbjhhZXY2bmZFeTd0cXJjdGFEckNw',
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        method: "POST"
      };

      var strResponse = '';
        var reqObj = https.request(options, function(resp){
          resp.on('data', function(chunk) {
            strResponse += chunk;
          });
          resp.on('end', function() {
            console.info(strResponse);

            if (resp.statusCode != 200){
              callback(null);
            }
            else {
              var dataResult = JSON.parse(strResponse);

              var moreOptions = {
                host: 'api.lyft.com'
                , port: 443
                , path: '/v1/drivers?lat=' + lyftObj.start_latitude + '&lng=' + lyftObj.start_longitude
                , method: 'GET'
                ,
                headers: {
                  'Authorization': 'Bearer ' + dataResult.access_token
                  , 'Accept': 'application/json'
                }
              }

              var strResponse2 = '';
              var reqObj2 = https.request(moreOptions, function(resp2){
                resp2.on('data',function(chunk2){
                  strResponse2 += chunk2;
                });
                resp2.on('end', function() {
                  console.info(strResponse2);

                  if (resp2.statusCode >= 305){
                    callback(null);
                  }
                  else {
                    console.info('callback from lyft with time ' + strResponse2)

                    var jsonresponse2 = JSON.parse(strResponse2);
                    callback(jsonresponse2);
                  }
                });
                resp2.on('error',function(err2){
                  console.error(err2);
                });
              });
              reqObj2.on('error',function(err){console.error(err);});
              reqObj2.end();
            }
          });
        });
        reqObj.write(postData);
        reqObj.on('error',function(err){console.error(err);});
        reqObj.end();
      }
    }
  };
};
