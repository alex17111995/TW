/**
 * Created by Ciubi on 26/03/16.
 */
var PubSubFactory = require('../FactoryPubSub');
var promise = require('promise');
var channels = require('../channels');
//var dynamicTarget = require('./../controller/dynamic_target_listener');
var oracleconnect = require('../oracleconnect');
var oracledb = require('oracledb');

var kidModel = function () {
};

const IGNORE_PARAMETER = -2;

const TIMER_OFFLINE = 10000;




var isInPermittedLocation = function (object_location, targets) { //PRIVATE FUNCTION NOT IN PROTOTYPE
    var kid_longitude = object_location.longitude;
    var kid_latitude = object_location.latitude;
    var earthRadius = 6371000;
    for (var i = 0; i < targets.length; i++) {
        var target_latitude = targets[i].latitude;
        var target_longitude = targets[i].longitude;
        var radiansLat = (kid_latitude - target_latitude) * (Math.PI / 180);
        var radiansLong = (kid_longitude - target_longitude) * (Math.PI / 180);
        var a = Math.sin(radiansLat / 2) * Math.sin(radiansLat / 2) + Math.cos(kid_latitude * (Math.PI / 180)) * Math.cos(target_latitude * Math.PI / 180) * Math.sin(radiansLong) * Math.sin(radiansLong);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var dist = earthRadius * c;
        if (dist < targets[i].radius)
            return true;
    }
    return false;
};
var setOffline = function (kid, information) {
    return new promise(function (resolve, reject) {
        oracleconnect.executeSQL('insert into children_Location values(:kid,:latitude,:longitude,0,systimestamp', {
            'kid': kid,
            latitude: information['latitude'],
            longitude: information['longitude']
        }).then(function () {


        });
    });
};


kidModel.prototype.updateLocation = function (kid, information, timeoutID) {
    return new promise(function (resolve, reject) {
        oracleconnect.executeSQL('BEGIN update_location_child(:kid,:latitude,:longitude,1,:timestamp_out); END;', {
            kid: kid,
            latitude: information['latitude'],
            longitude: information['longitude'],
            timestamp_out: {
                type: oracledb.STRING, dir: oracledb.BIND_OUT
            }
        }).then(function (results) {
            var notifier = PubSubFactory(channels.getChildChannelName(), kid);
            notifier.publish({
                channel: 'new_child_location',
                data: {
                    'kid': kid,
                    'latitude': information['latitude'],
                    'longitude': information['longitude'],
                    'is_online': 1,
                    'timestamp': results.outBinds.timestamp_out
                }
            });
            resolve({
                'latitude': information['latitude'],
                'longitude': information['longitude'],
                'is_online': 1,
                'timestamp': results.outBinds.timestamp_out
            });


        }).catch(function (error) {
            reject(error);
        });
    });
};


kidModel.prototype.get_child_location = function (kid) {
    return new promise(function (resolve, reject) {
        oracleconnect.executeSQL('SELECT longitude,latitude,is_online from children_location where kid=:kid', {
            'kid': kid
        }).then(function (results) {
            if (results.rows.length == 0) {
                resolve(undefined);
                return;
            }
            resolve({
                longitude: results.rows[0][0],
                latitude: results.rows[0][1],
                is_online: results.rows[0][2]
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
                    username: first_row[0],
                    first_name: first_row[1],
                    last_name: first_row[2],
                    latitude: first_row[3],
                    longitude: first_row[4]
                });

            }).catch(function (error) {
            reject(error);
        });
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
                        firstname: results.rows[i][2],
                        lastname: results.rows[i][3]
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
        connection.execute('select pid,radius_dynamic_target,latitude,longitude,is_online,last_update_timestamp' +
            ' from children_location natural join child_handlers where is_dynamic_target is not null and kid=:kid',
            {
                kid: kid
            }).then(function (results) {
                var array = [];
                for (var i = 0; i < results.rows.length; ++i) {
                    var obj = {};
                    for (var j = 0; j < results.metaData.length; j++) {
                        obj[results.metaData[j]] = results.rows[i];
                    }
                    array.push(obj);
                }
                resolve(array);
            })
            .catch(function (error) {
                reject(error);
            });
    });
};


kidModel.prototype.get_notifications = function (kid) {//
    return new promise(function (resolve, reject) {
        oracleconnect.getConnection().then(function (connection) {
            var promise_user_credentials = this.locationOfUserAndCredentials(connection, kid);
            var promise_static_targets = this.static_targets_of_child(connection, kid);
            var promise_handlers_of_child = this.get_handlers_of_child_and_access_request(connection, kid);
            var promise_dynamic_targets = this.get_dynamic_targets(connection, kid);
            promise.all([promise_user_credentials, promise_static_targets, promise_handlers_of_child, promise_dynamic_targets])
                .then(function (array_results) {
                    resolve({
                        'kid_location_and_name': array_results[0],
                        'static_targets': array_results[1],
                        'child_handlers': array_results[2],
                        'dynamic_targets': array_results[3]
                    });
                    oracleconnect.releaseConnection(connection);
                }).catch(function (error) {
                oracleconnect.releaseConnection(connection);
                reject(error);
            });

        }.bind(this));
    }.bind(this));

};


kidModel.prototype.hasGoneOffline = function () {


};


module.exports = kidModel;
