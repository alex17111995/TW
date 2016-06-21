/**
 * Created by Alex on 5/4/2016.
 */
var channels = require('../channels.js');
var geometry_functions = require('../geometry_coordinates');
var promise = require('promise');
var util = require('util');
var PubSubFactory = require('../FactoryPubSub');
var poller_map = new Map();


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


var poller_listener = function (kid) {
    this.kid = kid;

};

poller_listener.prototype.newLocation = function (latitude, longitude) {
    var poller=this;
    this.latitude=latitude;
    this.longitude=longitude;
    this.stop_polling = false;
    if (poller.intervalID == undefined) {
        poller.intervalID = setIntervalImmediate(function () {
                poll_events(poller.latitude, poller.longitude).then(function (results) {
                    if (poller.stop_polling == true) {
                        clearInterval(poller.intervalID);
                        poller_listener.intervalID = undefined;
                        console.log('am oprit pollerul');
                        results = []; //golim datele noi deoarece copilul e offline
                        poller_map.delete(poller.kid);
                    }
                    PubSubFactory.publish_if_existing(channels.getChildChannelName(),poller.kid,{
                        'channel': 'incidents',
                        'data': {
                            events: results,
                            kid: poller.kid
                        }
                    });
                    incidents_model.update_incidents(poller.kid, results);
                    console.log(results);
                }).catch(function (error) {
                    console.log(error);
                })
            }
            , 1000 * 60 * 5)
    }

};
poller_listener.prototype.offline = function () {
    this.stop_polling = true;
    console.log('opresc pollerul');

};

var get_instance = function (kid) {
    var poller_instance = poller_map.get(kid);
    if (poller_instance != undefined) {
        return poller_instance;
    }
    var instance= new poller_listener(kid);
    poller_map.set(kid,instance);
    return instance;
};

module.exports = {
    start_polling: function (kid, latitude, longitude) {
        var poller_listener = get_instance(kid);
        poller_listener.newLocation(latitude, longitude);
    },
    stop_polling: function (kid) {
        var poller_instance = poller_map.get(kid);
        if (poller_instance != undefined) {
            poller_instance.offline();
        }

    }
};








