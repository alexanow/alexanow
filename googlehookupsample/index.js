'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');
var uberUrl = 'https://api.uber.com/v1/estimates/price'
var lyftUrl = 'https://api.lyft.com/oauth/token'
var uberParams = {}
var googleApi = require('./googleapi').googleapis();
var carServiceApi = require('./carserviceapi').carserviceapis();
var querystring = require('querystring');
var uberClientID = '5DlrY2RQDJ3yd_QQ9vsil1bd1BDV5oIzthF5fAib';
var lyftClientID = 'yBB9HBdqBmm3';

router.get('/', function(req, res) {
  res.render('index');
});

router.get('/page2',function(req,res){
  res.render('page2');
});

router.post('/page2',function(req,res){
  console.log('origin post:' + req.body.origin);
  console.log('destination post:' + req.body.destination);
  res.render('page2',{
    origin: req.body.origin,
    destination: req.body.destination
  }
)
});

router.get('/lyftDriversNearBy',function(req,res){
  console.log('get nearby lyft drivers');
  var qryOrigin = req.query.o;
  var qryDestination = req.query.d;
  var googleOrigin = {};
  var googleDestination = {};
  googleApi.googleLocation(qryOrigin, function(result){
    googleOrigin = result;
    googleApi.googleLocation(qryDestination, function(result2){
      googleDestination = result2;
      carServiceApi.lyftDriversNearBy(((((googleOrigin || {}).results || [{}])[0] || {} ).geometry || {}).location,((((googleDestination || {}).results || [{}])[0] || {} ).geometry || {}).location,function(result3){
        res.send(result3);
      });
    });
  });
});

router.post('/directions', function(req,res){
  console.log('post for directions');


  var qryOrigin = req.body.origin;
  var qryDestination = req.body.destination;
  var googleOrigin = {};
  var googleDestination = {};
  var comparisonResults = { fast_mode: '', modes: [], optimal_mode: '', trade_off:'', trade_on: '' };
  var sortAndParse = function(){
    comparisonResults.modes.sort(function(a,b){return Math.round(a.duration.value /60.0 - b.duration.value / 60.0) * 2 + (Math.round(a.cost.value) - Math.round(b.cost.value));});
    comparisonResults.fast_mode = comparisonResults.modes[0].type;
    if (Math.round(comparisonResults.modes[1].cost.value) > Math.round(comparisonResults.modes[0]) ){
      comparisonResults.trade_off = comparisonResults.modes[1].type + ' is ' + Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) + ' minute' + (Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) == 1 ? '' : 's') + ' slower and ' + Math.round(comparisonResults.modes[1].cost.value - comparisonResults.modes[0].cost.value) + ' dollar' + (Math.round(comparisonResults.modes[1].cost.value - comparisonResults.modes[0].cost.value) == 1 ? ' ' : 's ') + 'more';
    }
    else if (Math.round(comparisonResults.modes[1].cost.value) < Math.round(comparisonResults.modes[0])){
      comparisonResults.trade_off = comparisonResults.modes[1].type + ' is ' + Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) + ' minute' + (Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) == 1 ? '' : 's') + ' slower but ' + Math.round(comparisonResults.modes[1].cost.value - comparisonResults.modes[0].cost.value) + ' dollar' + (Math.round(comparisonResults.modes[1].cost.value - comparisonResults.modes[0].cost.value) == 1 ? ' ' : 's ') + 'less';
    }
    else {
      comparisonResults.trade_off = comparisonResults.modes[1].type + ' is ' + Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) + ' minute' + (Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) == 1 ? '' : 's') + ' slower and costs about the same';
    }
    comparisonResults.trade_on = 'The ' + comparisonResults.modes[0].type + ' will get you there in ' + Math.round( comparisonResults.modes[0].duration.value / 60) + ' minute' + (Math.round( comparisonResults.modes[0].duration.value / 60) == 1 ? '' : 's') + ' for ' + Math.round(comparisonResults.modes[0].cost.value) + ' buck' + ((comparisonResults.modes[0].cost.value) == 1 ? '' : 's');
  };
  googleApi.googleLocation(qryOrigin, function(result){
    googleOrigin = result;
    googleApi.googleLocation(qryDestination, function(result2){
      googleDestination = result2;
      googleApi.googleDirections(googleOrigin.results[0].formatted_address, googleDestination.results[0].formatted_address, {mode: 'walking'}, function(result3){
        var route3 = result3.routes[0].legs[0];
        comparisonResults.modes.push({'type': 'Walking', 'logo': '/img/walking.png', 'callToAction': 'Open Google Maps', 'deepLink': 'https://www.google.com/maps/dir/' + googleOrigin.results[0].geometry.location.lat + ',' + googleOrigin.results[0].geometry.location.lng + '/' + querystring.escape(googleDestination.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='street_number';});}) + googleDestination.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='route';});}) )  + '/@' + googleDestination.results[0].geometry.location.lat + ',' + googleDestination.results[0].geometry.location.lng + 'z' , duration: { text: route3.duration.text, value: route3.duration.value}, distance: { text: route3.distance.text, value: route3.distance.value}, cost: { text: 'free', value: (route3.distance.value / 1609) } });
        comparisonResults.modes.push({'type': 'Running', 'logo': '/img/walking.png', duration: { text: Math.round(route3.duration.value / 2 / 60) + ' mins', value: route3.duration.value/2 }, distance: { text: route3.distance.text, value: route3.distance.value}, cost: { text: 'free', value: (route3.distance.value / 1609 * 1.5) } });
        googleApi.googleDirections(googleOrigin.results[0].formatted_address, googleDestination.results[0].formatted_address, {mode: 'bicycling'}, function(result4){
          var route4 = result4.routes[0].legs[0];
          comparisonResults.modes.push({'type': 'Cycling', 'logo': '/img/nyc.jpg', duration: { text: route4.duration.text, value: route4.duration.value}, distance: { text: route4.distance.text, value: route4.distance.value}, cost: { text: 'free', value: (route4.distance.value / 1609 / 4) } });
          googleApi.googleDirections(googleOrigin.results[0].formatted_address, googleDestination.results[0].formatted_address, {mode: 'transit', transitMode: 'bus'}, function(result5){
            var route5 = result5.routes[0].legs[0];
            comparisonResults.modes.push({'type': 'MTA Bus', 'logo': '/img/mta.png', duration: { text: route5.duration.text, value: route5.duration.value}, distance: { text: route5.distance.text, value: route5.distance.value}, cost: { text: '$2.75', value: 2.75 } });
            googleApi.googleDirections(googleOrigin.results[0].formatted_address, googleDestination.results[0].formatted_address, {mode: 'transit', transitMode: 'rail'}, function(result6){
              var route6 = result6.routes[0].legs[0];
              comparisonResults.modes.push({'type': 'Subway','deepLink': 'http://web.mta.info/maps/submap.html','callToAction': 'MTA Subway Map', 'logo': '/img/mta.png', duration: { text: route6.duration.text, value: route6.duration.value}, distance: { text: route6.distance.text, value: route6.distance.value}, cost: { text: '$2.75', value: 2.75 } });
              carServiceApi.uberEstimate((googleOrigin.results[0].geometry || {}).location ,(googleDestination.results[0].geometry || {}).location ,function(result7){
                if (result7 && result7.prices && result7.prices.length){
                  result7.prices.forEach(function(element,index,array){
                    if (element.localized_display_name && element.duration && element.distance && element.estimate && element.high_estimate)
                    {
                      var uberDeepLinkUrl = 'https://m.uber.com/ul?client_id='
                      + uberClientID
                      + '&action=setPickup&pickup[latitude]='
                      + googleOrigin.results[0].geometry.location.lat
                      + '&pickup[longitude]='
                      + googleOrigin.results[0].geometry.location.lng
                      + '&pickup[nickname]=' + querystring.escape(googleOrigin.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='street_number';});}) + googleOrigin.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='route';});}) )
                       + '&pickup[formatted_address]=' + querystring.escape(googleOrigin.results[0].formatted_address)
                       + '&dropoff[latitude]=' + googleDestination.results[0].geometry.location.lat
                       + '&dropoff[longitude]=' + googleDestination.results[0].geometry.location.lng
                       + '&dropoff[nickname]=' + querystring.escape(googleDestination.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='street_number';});}) + googleDestination.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='route';});}) )
                       + '&dropoff[formatted_address]=' + querystring.escape(googleDestination.results[0].formatted_address)
                       + '&product_id=' + element.product_id
                       + '&link_text=Order%20an%20' + element.localized_display_name
                       + '&partner_deeplink=' + querystring.escape('https://www.newyorkminute.info/#/uber-thank-you?startLoc=' + querystring.escape(JSON.stringify(googleOrigin.results[0].geometry.location)) + '&stopLoc=' + querystring.escape(JSON.stringify(googleDestination.results[0].geometry.location))  );
                      comparisonResults.modes.push(
                        {'type': element.localized_display_name
                        , 'logo' : '/img/uber.jpg'
                        , 'deepLink' : uberDeepLinkUrl
                        , 'callToAction': 'Order an ' + element.localized_display_name
                      , duration: { text: Math.round( element.duration / 60)  + ' mins', value: element.duration }
                      , distance: { text: element.distance + ' miles', value: element.distance * 1609.34}
                      , cost: { text: element.estimate , value: element.high_estimate } });
                    }
                    });
                  }
                  carServiceApi.lyftEstimate((googleOrigin.results[0].geometry || {}).location ,(googleDestination.results[0].geometry || {}).location ,function(result8){
                    if (result8 && result8.cost_estimates && result8.cost_estimates.length){
                      result8.cost_estimates.forEach(function(element,index,array){
                        if (element.ride_type && element.estimated_duration_seconds && element.estimated_cost_cents_max && element.estimated_distance_miles && element.display_name && element.estimated_cost_cents_min){
                          var lyftDeepLink = 'lyft://ridetype?id=' + element.ride_type
                          + '&partner=' + lyftClientID
                          + '&pickup[latitude]=' + googleOrigin.results[0].geometry.location.lat + '&pickup[longitude]=' + googleOrigin.results[0].geometry.location.lng + '&destination[latitude]=' + googleDestination.results[0].geometry.location.lat + '&destination[longitude]=' + googleDestination.results[0].geometry.location.lng;
                          comparisonResults.modes.push({
                            'type': element.display_name
                            , 'logo' : '/img/lyft.png'
                            , 'deepLink': lyftDeepLink
                            , 'callToAction' : 'Order a ' + element.display_name
                            , 'duration' : { text: Math.round(element.estimated_duration_seconds / 60) + ' minutes', value: element.estimated_duration_seconds }
                            , 'distance' : { text: element.estimated_distance_miles + ' miles', value: element.estimated_distance_miles * 1609.34  }
                            , 'cost' : { text: '$' + Math.round(element.estimated_cost_cents_min / 100.0) + ' - ' + '$' + Math.round(element.estimated_cost_cents_max / 100.0), value: element.estimated_cost_cents_max / 100.0 }
                          });
                        }
                      });
                    }
                    sortAndParse();

                    res.send(comparisonResults);

                  });

              });

            });
          });
        });
      });
    });
  });


});

router.get('/directions/alexa',function(req,res){
  console.log('get for directions from alexa');
  var qryOrigin = req.query.o;
  var qryDestination = req.query.d;
  var googleOrigin = {};
  var googleDestination = {};
  var comparisonResults = { fast_mode: '', modes: [], optimal_mode: '', trade_off:'', trade_on: '' };
  var sortAndParse = function(){
    comparisonResults.modes.sort(function(a,b){return a.duration.value - b.duration.value;});
    comparisonResults.fast_mode = comparisonResults.modes[0].type;
    if (Math.round(comparisonResults.modes[1].cost.value) > Math.round(comparisonResults.modes[0]) ){
      comparisonResults.trade_off = comparisonResults.modes[1].type + ' is ' + Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) + ' minute' + (Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) == 1 ? '' : 's') + ' slower and ' + Math.round(comparisonResults.modes[1].cost.value - comparisonResults.modes[0].cost.value) + ' dollar' + (Math.round(comparisonResults.modes[1].cost.value - comparisonResults.modes[0].cost.value) == 1 ? ' ' : 's ') + 'more';
    }
    else if (Math.round(comparisonResults.modes[1].cost.value) < Math.round(comparisonResults.modes[0])){
      comparisonResults.trade_off = comparisonResults.modes[1].type + ' is ' + Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) + ' minute' + (Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) == 1 ? '' : 's') + ' slower but ' + Math.round(comparisonResults.modes[1].cost.value - comparisonResults.modes[0].cost.value) + ' dollar' + (Math.round(comparisonResults.modes[1].cost.value - comparisonResults.modes[0].cost.value) == 1 ? ' ' : 's ') + 'less';
    }
    else {
      comparisonResults.trade_off = comparisonResults.modes[1].type + ' is ' + Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) + ' minute' + (Math.round(comparisonResults.modes[1].duration.value / 60 - comparisonResults.modes[0].duration.value / 60) == 1 ? '' : 's') + ' slower and costs about the same';
    }
    comparisonResults.trade_on = 'The ' + comparisonResults.modes[0].type + ' will get you there in ' + Math.round( comparisonResults.modes[0].duration.value / 60) + ' minute' + (Math.round( comparisonResults.modes[0].duration.value / 60) == 1 ? '' : 's') + ' for ' + Math.round(comparisonResults.modes[0].cost.value) + ' buck' + ((comparisonResults.modes[0].cost.value) == 1 ? '' : 's');
  };
  googleApi.googleLocation(qryOrigin, function(result){
    googleOrigin = result;
    googleApi.googleLocation(qryDestination, function(result2){
      googleDestination = result2;
      googleApi.googleDirections(googleOrigin.results[0].formatted_address, googleDestination.results[0].formatted_address, {mode: 'walking'}, function(result3){
        var route3 = result3.routes[0].legs[0];
        comparisonResults.modes.push({'type': 'Walking', 'logo': '/img/walking.png', duration: { text: route3.duration.text, value: route3.duration.value}, distance: { text: route3.distance.text, value: route3.distance.value}, cost: { text: 'free', value: (route3.distance.value / 1609) } });
        comparisonResults.modes.push({'type': 'Running', 'logo': '/img/walking.png', duration: { text: Math.round(route3.duration.value / 2 / 60) + ' mins', value: route3.duration.value/2 }, distance: { text: route3.distance.text, value: route3.distance.value}, cost: { text: 'free', value: (route3.distance.value / 1609 * 1.5) } });
        googleApi.googleDirections(googleOrigin.results[0].formatted_address, googleDestination.results[0].formatted_address, {mode: 'bicycling'}, function(result4){
          var route4 = result4.routes[0].legs[0];
          comparisonResults.modes.push({'type': 'Cycling', 'logo': '/img/nyc.jpg', duration: { text: route4.duration.text, value: route4.duration.value}, distance: { text: route4.distance.text, value: route4.distance.value}, cost: { text: 'free', value: (route4.distance.value / 1609 / 4) } });
          googleApi.googleDirections(googleOrigin.results[0].formatted_address, googleDestination.results[0].formatted_address, {mode: 'transit', transitMode: 'bus'}, function(result5){
            var route5 = result5.routes[0].legs[0];
            comparisonResults.modes.push({'type': 'MTA Bus', 'logo': '/img/mta.png', duration: { text: route5.duration.text, value: route5.duration.value}, distance: { text: route5.distance.text, value: route5.distance.value}, cost: { text: '$2.75', value: 2.75 } });
            googleApi.googleDirections(googleOrigin.results[0].formatted_address, googleDestination.results[0].formatted_address, {mode: 'transit', transitMode: 'rail'}, function(result6){
              var route6 = result6.routes[0].legs[0];
              comparisonResults.modes.push({'type': 'Subway','deepLink': 'http://web.mta.info/maps/submap.html','callToAction': 'MTA Subway Map', 'logo': '/img/mta.png', duration: { text: route6.duration.text, value: route6.duration.value}, distance: { text: route6.distance.text, value: route6.distance.value}, cost: { text: '$2.75', value: 2.75 } });
              carServiceApi.uberEstimate((googleOrigin.results[0].geometry || {}).location ,(googleDestination.results[0].geometry || {}).location ,function(result7){
                if (result7 && result7.prices && result7.prices.length){
                  result7.prices.forEach(function(element,index,array){
                    if (element.localized_display_name && element.duration && element.distance && element.estimate && element.high_estimate)
                    {
                      var uberDeepLinkUrl = 'https://m.uber.com/ul?client_id='
                      + uberClientID
                      + '&action=setPickup&pickup[latitude]='
                      + googleOrigin.results[0].geometry.location.lat
                      + '&pickup[longitude]='
                      + googleOrigin.results[0].geometry.location.lng
                      + '&pickup[nickname]=' + querystring.escape(googleOrigin.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='street_number';});}) + googleOrigin.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='route';});}) )
                       + '&pickup[formatted_address]=' + querystring.escape(googleOrigin.results[0].formatted_address)
                       + '&dropoff[latitude]=' + googleDestination.results[0].geometry.location.lat
                       + '&dropoff[longitude]=' + googleDestination.results[0].geometry.location.lng
                       + '&dropoff[nickname]=' + querystring.escape(googleDestination.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='street_number';});}) + googleDestination.results[0].address_components.find(function(comp){return comp.types.find(function(typ){return typ==='route';});}) )
                       + '&dropoff[formatted_address]=' + querystring.escape(googleDestination.results[0].formatted_address)
                       + '&product_id=' + element.product_id
                       + '&link_text=Order%20an%20' + element.localized_display_name
                       + '&partner_deeplink=' + querystring.escape('https://www.newyorkminute.info/#/uber-thank-you?startLoc=' + querystring.escape(JSON.stringify(googleOrigin.results[0].geometry.location)) + '&stopLoc=' + querystring.escape(JSON.stringify(googleDestination.results[0].geometry.location))  );
                      comparisonResults.modes.push(
                        {'type': element.localized_display_name
                        , 'logo' : '/img/uber.jpg'
                        , 'deepLink' : uberDeepLinkUrl
                        , 'callToAction': 'Order an ' + element.localized_display_name
                      , duration: { text: Math.round( element.duration / 60)  + ' mins', value: element.duration }
                      , distance: { text: element.distance + ' miles', value: element.distance * 1609.34}
                      , cost: { text: element.estimate , value: element.high_estimate } });
                    }
                    });
                  }
                  carServiceApi.lyftEstimate((googleOrigin.results[0].geometry || {}).location ,(googleDestination.results[0].geometry || {}).location ,function(result8){
                    if (result8 && result8.cost_estimates && result8.cost_estimates.length){
                      result8.cost_estimates.forEach(function(element,index,array){
                        if (element.ride_type && element.estimated_duration_seconds && element.estimated_cost_cents_max && element.estimated_distance_miles && element.display_name && element.estimated_cost_cents_min){
                          var lyftDeepLink = 'lyft://ridetype?id=' + element.ride_type
                          + '&partner=' + lyftClientID
                          + '&pickup[latitude]=' + googleOrigin.results[0].geometry.location.lat + '&pickup[longitude]=' + googleOrigin.results[0].geometry.location.lng + '&destination[latitude]=' + googleDestination.results[0].geometry.location.lat + '&destination[longitude]=' + googleDestination.results[0].geometry.location.lng;
                          comparisonResults.modes.push({
                            'type': element.display_name
                            , 'logo' : '/img/lyft.png'
                            , 'deepLink': lyftDeepLink
                            , 'callToAction' : 'Order a ' + element.display_name
                            , 'duration' : { text: Math.round(element.estimated_duration_seconds / 60) + ' minutes', value: element.estimated_duration_seconds }
                            , 'distance' : { text: element.estimated_distance_miles + ' miles', value: element.estimated_distance_miles * 1609.34  }
                            , 'cost' : { text: '$' + Math.round(element.estimated_cost_cents_min / 100.0) + ' - ' + '$' + Math.round(element.estimated_cost_cents_max / 100.0), value: element.estimated_cost_cents_max / 100.0 }
                          });
                        }
                      });
                    }
                    sortAndParse();

                    res.send(comparisonResults);

                  });

              });

            });
          });
        });
      });
    });
  });
});

router.post('/uber', function(req, res) {

  console.log('req body on route ', req.body)

  var uberObj = {
    'start_latitude': req.body.startAddress.lat,
    'start_longitude': req.body.startAddress.lng,
    'end_latitude': req.body.destAddress.lat,
    'end_longitude': req.body.destAddress.lng
  }

  uberUrl = uberUrl + '?start_latitude=' + req.body.startAddress.lat + '&start_longitude=' + req.body.startAddress.lng + '&end_latitude=' + req.body.destAddress.lat + '&end_longitude=' + req.body.destAddress.lng

  console.log('request ', req.body)

  var options = {
    url: uberUrl,
    headers: {
      'Authorization': 'Token 5DlrY2RQDJ3yd_QQ9vsil1bd1BDV5oIzthF5fAib'
    }
  };

  function callback(error, response, body) {
    console.log('error from uber ', error)
    console.log('response ', response)
    if (!error && response.statusCode == 200) {
      console.log('do we have a response from uber? ', response, body)
      // var info = JSON.parse(body);
      // console.log(info.stargazers_count + " Stars");
      // console.log(info.forks_count + " Forks");
      res.json({
        'response': response
      });
    }
  }
  request(options, callback);


});

router.post('/lyft', function(req, res) {

	// eUJCOUhCZHFCbW0zOjZ2QUxwQ1ZoY1pxbjhhZXY2bmZFeTd0cXJjdGFEckNw
	// PHlCQjlIQmRxQm1tMz46PCA2dkFMcENWaGNacW44YWV2Nm5mRXk3dHFyY3RhRHJDcCA
	// eUJCOUhCZHFCbW0zOjZ2QUxwQ1ZoY1pxbjhhZXY2bmZFeTd0cXJjdGFEckNw

  var options = {
  	url: lyftUrl,
    headers: {
      'Authorization': 'Basic eUJCOUhCZHFCbW0zOjZ2QUxwQ1ZoY1pxbjhhZXY2bmZFeTd0cXJjdGFEckNw',
      'Content-Type': 'application/json'
    },
    form: {"grant_type": "client_credentials", "scope": "public"},
    method: "post"
  };



  function callback(error, response, body) {
    // console.log('error from lyft ', error)
    // console.log('response ', response)

    console.log('we are in the callback function \n\n\n\n\n')
    console.log('response ', body)
    console.log('error ', error)
    if (!error && response.statusCode == 200) {
      // console.log('do we have a response from lyft? ', response, body)
      console.log('we are in the callback function inside')
      // var info = JSON.parse(body);
      // console.log(info.stargazers_count + " Stars");
      // console.log(info.forks_count + " Forks");
      // res.json({
      //   'response': response,
      //   'body': body
      // })

			console.log('response ', response.body)
			console.log('typeof response ', typeof response.body)

			console.log('body access token used ', response.body.access_token)

			var jsonresponse = JSON.parse(response.body);

			console.log('json response ', jsonresponse)

      var moreOptions = {
      	url: 'https://api.lyft.com/v1/cost?start_lat=' + req.body.startAddress.lat + '&start_lng=' + req.body.startAddress.lng + '&end_lat=' + req.body.destAddress.lat + '&end_lng=' + req.body.destAddress.lng,
      	headers: {
      		'Authorization': 'Bearer ' + jsonresponse.access_token
      	}
      }
      function moreCallback(error, response, body) {
      	console.log('callback from lyft with time ', body)

      	var jsonresponse2 = JSON.parse(response.body)

      	res.json({'response': jsonresponse2})
      }

      request(moreOptions, moreCallback)


    }
  }
  request(options, callback);

})

router.get('/lyft/callback', function(req, res) {
	console.log('we are in the callback route \n\n\n\n')
	console.log('req.body in callback route ', req.body)
	console.log('req.query', req.query)
	// console.log('we are in the callback for lyft \n\n\n\n\n\n')
	// console.log('response from lyft ', req)
	// console.log('access token ', req.access_token)
	// console.log('request from lyft ', req.body)
	res.json({'stuff': 'stuff'})

});





module.exports = router;
