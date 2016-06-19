/**
 * Created by Alex on 5/4/2016.
 */
var channels = require('../channels.js');
var geometry_functions = require('../geometry_coordinates');
var promise = require('promise');
var util = require('util');
var getOptions = function (boundingBox) {
    var path = util.format('/REST/v1/Traffic/Incidents/%d,%d,%d,%d',
            boundingBox.south, boundingBox.west, boundingBox.north, boundingBox.east)
        + '?key=AjjFJYkShia2j19OE36pGhPDtAl_X_DxG90Qf3uGHRu2G0-6-Klg0kHPRMdUy2si';
    var obj = {
        host: 'dev.virtualearth.net',
        path: path
    };
    return obj;
};


var http = require('http');
var incidents_model = require('../model/kid_incidents_model');


var parse_incidents = function (json_bing) {
    return new promise(function (resolve, reject) {
        process.nextTick(function () {
            var bingJson = JSON.parse(json_bing);
            if (bingJson == undefined)
                reject(new Error('invalid JSON from poller'));
            var resourceSets = bingJson['resourceSets'];
            var incidentsArrayToAdd = [];
            for (var i = 0; i < resourceSets.length; ++i) {
                var resources = resourceSets[i].resources;
                for (var j = 0; j < resources.length; j++) {

                    incidentsArrayToAdd.push({
                        latitude: resources[j].point.coordinates[0],
                        longitude: resources[j].point.coordinates[1],
                        type: resources[j].type,
                        start: resources[j].start
                    });
                }
            }

            resolve(incidentsArrayToAdd)
        });
    });

};

var setIntervalImmediate = function (callback, interval) {
    callback();
    return setInterval(callback, interval);
};

var request_promise = function (options) {
    return new promise(function (resolve, reject) {
        var req = http.request(options, function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                resolve(str);
            });
        });
        req.on('error', function (err) {
            reject(err);
        });
        req.end();
    });
};


var poll_events = function (latitude, longitude) {
    return new promise(function (resolve, reject) {
        var bounding_box = geometry_functions.boundingBox(latitude, longitude, 10);
        request_promise(getOptions(bounding_box))
            .then(function (response) {
                return parse_incidents(response);
            }).then(function (responsonseParsed) {
                resolve(responsonseParsed);
            })
            .catch(function (error) {
                reject(error);
            });
    });


};
var stop_polling = function (poller_listener) {
    poller_listener.stop_polling = true;
};

//TODO case going really far from poll location
var start_polling = function (poller_listener) {
    poller_listener.stop_polling = false;
    if (poller_listener.intervalID == undefined) {
        poller_listener.intervalID = setIntervalImmediate(function () {
                poll_events(poller_listener.latitude, poller_listener.longitude).then(function (results) {
                    if (poller_listener.stop_polling = true) {
                        clearInterval(poller_listener.intervalID);
                        poller_listener.intervalID = undefined;
                        console.log('am oprit pollerul');
                    }
                    if (poller_listener) {

                        poller_listener.channel_to_subscribe.publish({
                            'channel': 'incidents',
                            'data': {
                                events: results,
                                kid: poller_listener.kid
                            }

                        });
                        incidents_model.update_incidents(poller_listener.kid, results);
                        console.log(results);
                    }
                }).catch(function (error) {
                    console.log(error);
                })
            }
            , 300000)
    }
};


var poller_listener = function (channelToPublish, kid) {
    this.channel_to_subscribe = channelToPublish;
    this.kid = kid;
    this.handler = function (message) {

        if (message.channel === 'new_child_location') {
            this.latitude = message.data.latitude;
            this.longitude = message.data.longitude;
            start_polling(this);
        }
        if (message.channel === 'child_offline') {
            stop_polling(this);
        }


    }.bind(this);
    channelToPublish.subs(this.handler);
};
poller_listener.prototype.close = function () {
    if (this.intervalID != undefined) {
        clearInterval(this.intervalID);
    }
    this.channel_to_subscribe.unsubscribe(this.handler);
    this.handler = undefined;
    this.channel_to_subscribe = undefined;
};


module.exports = poller_listener;


//TODO alterRadius






