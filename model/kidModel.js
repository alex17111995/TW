/**
 * Created by Ciubi on 26/03/16.
 */
var PubSubFactory = require('../FactoryPubSub');
var promise = require('promise');
var channels = require('../channels');
//var dynamicTarget = require('./../controller/dynamic_target_listener');
var oracleconnect = require('../oracleconnect');
var oracledb = require('oracledb');
var mapTimeouts = new Map();
var geoFancing = require('./geo_fencing');
var validations = require('./validations');
var incidents = require('./kid_incidents_model');

var clearTimeoutId = function (kid) {
    if (mapTimeouts.get(kid) != undefined) {
        clearTimeout(mapTimeouts.get(kid));
        mapTimeouts.delete(kid);
    }
};
var isOnline = function (kid) {
    return mapTimeouts.get(kid) != undefined;
};

var setTimeoutId = function (kid, timeout) {
    mapTimeouts.set(kid, timeout);
};


var kidModel = function () {
};


var timeoutVALUE = 1000 * 60 * 1 / 4;
var update_location = function (kid, latitude, longitude) {
    return new promise(function (resolve, reject) {
        oracleconnect.executeSQL('BEGIN update_location_child(:kid,:latitude,:longitude,:timestamp_out); END;', {
            kid: kid,
            latitude: latitude,
            longitude: longitude,
            timestamp_out: {
                type: oracledb.STRING, dir: oracledb.BIND_OUT
            }

        }).then(function (results) {
                PubSubFactory.publish_if_existing(channels.getChildChannelName(), kid,{
                    channel: 'new_child_location',
                    data: {
                        'kid': kid,
                        'latitude': latitude,
                        'longitude': longitude,
                        'timestamp': results.outBinds.timestamp_out
                    }
                });
                resolve(true);
                geoFancing(kid);

            })
            .catch(function (error) {
                reject(error);

            });
    });
};


kidModel.prototype.updateLocation = function (kid, information) {

    return new promise(function (resolve, reject) {
        if (!validations.validate_update_location(kid, information)) {
            reject(new Error('invalid parameters'));
            return;
        }

        update_location(kid, information['latitude'], information['longitude'], 1)
            .then(function () {
                clearTimeoutId(kid);
                var timeoutID = setTimeout(function () {
                    onOffline(kid, information['latitude'], information['longitude'])
                }, timeoutVALUE);
                resolve(true);
                setTimeoutId(kid, timeoutID);
            })
            .catch(function (error) {
                reject(error);
            });
    });
};


kidModel.prototype.get_child_location = function (kid) {
    return new promise(function (resolve, reject) {
        oracleconnect.executeSQL('SELECT longitude,latitude from children_location where kid=:kid', {
            'kid': kid
        }).then(function (results) {
            if (results.rows.length == 0) {
                resolve(undefined);
                return;
            }
            resolve({
                longitude: results.rows[0][0],
                latitude: results.rows[0][1],
                is_online: isOnline(kid)
            });
        }).catch(function (error) {
            reject(error);
        });
    });
};


kidModel.prototype.locationOfUserAndCredentials = function (connection, kid) {
    return new promise(function (resolve, reject) {
        connection.execute('select c.username,c.firstname,c.lastname,' +
                'l.longitude,l.latitude from children' +
                ' c left outer join children_location l on c.kid=l.kid where c.kid=:kid', {kid: kid})
            .then(function (results) {
                if (results.rows == 0) {
                    reject(new Error("invalid user"));
                    return;
                }
                var first_row = results.rows[0];
                resolve({
                    kid: kid,
                    username: first_row[0],
                    first_name: first_row[1],
                    last_name: first_row[2],
                    latitude: first_row[4],
                    longitude: first_row[3],
                    is_online: isOnline(kid)
                });

            }).catch(function (error) {
            reject(error);
        });
    });

};

var onOffline = function (kid) {
    mapTimeouts.delete(kid);
   PubSubFactory.publish_if_existing(channels.getChildChannelName(), kid,
        {
            channel: 'offline_child',
            data: {
                'kid': kid
            }
        });
};

kidModel.prototype.static_targets_of_child = function (connection, kid) {
    return new promise(function (resolve, reject) {
        connection.execute('select static_target_id,latitude,longitude,radius,status from static_targets where status>0 and kid=:kid', {kid: kid})
            .then(function (results) {
                var rows = results.rows;
                var static_targets = [];
                for (var i = 0; i < results.rows.length; ++i) {
                    static_targets.push({
                        static_target_id: rows[i][0],
                        latitude: rows[i][1],
                        longitude: rows[i][2],
                        radius: rows[i][3],
                        status: rows[i][4]
                    });
                }
                resolve(static_targets);
            }).catch(function (error) {
            reject(error);
        });
    });
};


/*
 kidModel.prototype.get_notifications = function (kid, notification_types_required) {
 return new promise(function (resolve, reject) {
 this.get_child_location(kid).then(function (location) {
 resolve(location);
 }).catch(function (error) {
 reject(error);
 });
 }.bind(this));
 };
 */

kidModel.prototype.get_handlers_of_child_and_access_request = function (connection, kid) {
    return new promise(function (resolve, reject) {
        connection.execute('select pid,username,firstname,lastname ' +
                'from parents natural join child_handlers where kid=:kid', {kid: kid})
            .then(function (results) {
                var handlers = [];
                for (var i = 0; i < results.rows.length; ++i) {
                    handlers.push({
                        pid: results.rows[i][0],
                        username: results.rows[i][1],
                        first_name: results.rows[i][2],
                        last_name: results.rows[i][3]
                    });
                }
                resolve(handlers);
            })
            .catch(function (error) {
                reject(error);
            });
    });

};
kidModel.prototype.get_dynamic_targets = function (connection, kid) {
    return new promise(function (resolve, reject) {
        connection.execute('select c.pid,c.radius_dynamic_target' +
            ',p.latitude,p.longitude,p.last_timestamp_update from parents_location p right outer join child_handlers c on p.pid=c.pid where is_dynamic_target' +
            ' is not null and kid=:kid',
            {
                kid: kid
            }).then(function (results) {
                var parentModel = require('./child_handler');
                var parent = new parentModel();
                var array = [];
                for (var i = 0; i < results.rows.length; ++i) {
                    var obj = {
                        pid: results.rows[i][0],
                        radius: results.rows[i][1],
                        latitude: results.rows[i][2],
                        longitude: results.rows[i][3],
                        is_online: parent.isOnline(results.rows[i][0]),
                        last_timestamp_update: results.rows[i][5]
                    };
                    array.push(obj);
                }
                resolve(array);
            })
            .catch(function (error) {
                reject(error);
            });
    });
};
kidModel.prototype.isOnline = isOnline;

kidModel.prototype.get_notifications = function (kid) {//
    return new promise(function (resolve, reject) {
        oracleconnect.getConnection().then(function (connection) {
            var promise_user_credentials = this.locationOfUserAndCredentials(connection, kid);
            var promise_static_targets = this.static_targets_of_child(connection, kid);
            var promise_handlers_of_child = this.get_handlers_of_child_and_access_request(connection, kid);
            var promise_dynamic_targets = this.get_dynamic_targets(connection, kid);
            var promise_incidents = incidents.get_incidents(kid);
            promise.all([promise_user_credentials, promise_static_targets, promise_handlers_of_child, promise_dynamic_targets, promise_incidents])
                .then(function (array_results) {
                    resolve({
                        'kid_location_and_name': array_results[0],
                        'static_targets': array_results[1],
                        'child_handlers': array_results[2],
                        'dynamic_targets': array_results[3],
                        'incidents': array_results[4]
                    });
                    oracleconnect.releaseConnection(connection);
                }).catch(function (error) {
                oracleconnect.releaseConnection(connection);
                reject(error);
            });

        }.bind(this));
    }.bind(this));

};


module.exports = kidModel;
