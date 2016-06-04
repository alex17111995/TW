/**
 * Created by Alex on 5/4/2016.
 */
var channels = require('../channels.js');
var geometry_functions = require('../geometry_coordinates');
var promise = require('promise');
var getOptions = function (boundingBox) {
    var path = String.format('/REST/v1/Traffic/Incidents/+{0},{1},{2},{3}',
            boundingBox.south, boundingBox.west, boundingBox.north, boundingBox.east)
        + '?key=AjjFJYkShia2j19OE36pGhPDtAl_X_DxG90Qf3uGHRu2G0-6-Klg0kHPRMdUy2si';
    var obj = {
        host: 'dev.virtualearth.net',
        path: path
    };
};


var http = require('http');

var callback = function (response) {
    var str = '';
    response.on('data', function (chunk) {
        str += chunk;
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
    var bounding_box = geometry_functions.boundingBox(latitude, longitude);
    request_promise(getOptions(bounding_box)).then(function (response) {
            resolve(response);
        })
        .catch(function (error) {
            reject(error);
        });


};



var start_polling = function (poller_listener) {
    if (poller_listener.intervalID == undefined) {
        poller_listener.intervalID = setIntervalImmediate(function () {
                poll_events(poller_listener.latitude, poller_listener.longitude).then(function (results) {
                    poller_listener.channel_to_subscribe.publish({
                        'channel': 'incidents',
                        'data': {
                            events: results,
                            kid: poller_listener.kid
                        }
                    })
                    ;
                })
            }
            , 300000)
    }
};


var poller_listener = function (channelToPublish, kid) {
    //TODO stop polling if child becomes_offline_for_some_time
    this.handler = function (message) {
        this.channel_to_subscribe = channelToPublish;
        this.kid = kid;
        if (message.channel === 'new_child_location') {
            this.latitude = message.data.latitude;
            this.longitude = message.data.longitude;

            start_polling(this);
        }

    }.bind(this);
    channelToPublish.subs(this.handler);
};
module.exports = poller_listener;


//TODO alterRadius






