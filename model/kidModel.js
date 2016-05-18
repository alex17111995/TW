/**
 * Created by Ciubi on 26/03/16.
 */
var PubSubFactory = require('../FactoryPubSub');
var connection = require('./dbconnect');
var staticTarget = require('./static_target');
var promise = require('promise');
var channels = require('../channels');
//var dynamicTarget = require('./../controller/dynamic_target_listener');
var object_location = require('./object_location');
var kidModel = function () {

};

kidModel.prototype.subscribe = function (kid, callback) {
    var notifier = PubSubFactory(channels.getChildChannelName(), kid);
    var callbackNotifier = function (newEvent) {
        process.nextTick(function () {
            callback(newEvent);
        });
        notifier.unsubscribe(callbackNotifier);
    }.bind(this);
    notifier.subs(callbackNotifier);
    return callbackNotifier;
};
kidModel.prototype.unsubscribe = function (kid, callbackNotifier) {
    var notifier = PubSubFactory(channels.getChildChannelName(), this.id);
    notifier.unsubscribe(callbackNotifier);
};

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

kidModel.prototype.updateLocation = function (kid, information, callbackSuccessfulUpdated) {


    connection.beginTransaction(function (err) {
        connection.query('select COUNT(*) from kid_location where kid=?', [kid], function (err, rows, fields) {
            var timestamp = Date.now();
            var sql_query = 'update kid_location set timestamp=? , latitude=? , longitude=? where kid=?';
            if (err) {
                callbackSuccessfulUpdated(err);
                return;
            }
            if (rows[0]['COUNT(*)'] == 0) {
                sql_query = 'insert into kid_location(timestamp,latitude,longitude,kid) values(?,?,?,?)';
            }
            connection.query(sql_query, [timestamp, information['latitude'], information['longitude'], kid], function (err, rows, fields) {
                this.staticTargetsOfKid(kid, function (targets) {
                    var is_permitted = isInPermittedLocation(information, targets);
                    var object = {
                        'location': {
                            'longitude': information['longitude'],
                            'latitude': information['latitude'],
                            'online': true,
                            'timestamp': timestamp,
                            'is_permitted': is_permitted
                        }
                    };
                    connection.commit(function (err) {
                        if (err) {
                            return connection.rollback(function () {
                                throw  err
                            });
                        }
                        process.nextTick(function () {
                            this.publishNotifier(kid, object)
                            callbackSuccessfulUpdated(object);

                        }.bind(this));
                    }.bind(this));
                }.bind(this), function (err) {
                    callbackSuccessfulUpdated(err);
                }.bind(this));

            }.bind(this));
        }.bind(this));

    }.bind(this));


    //  'permittedLocation': isInPermittedLocation(this.location, this.kidTargets),
    //'location': this.location.print()


};
kidModel.prototype.publishNotifier = function (kid, message) {
    var notifier = PubSubFactory(channels.getChildChannelName(), kid);
    notifier.publish({'kid': kid, 'events': message});

};
kidModel.prototype.getNotifier = function () {
    return this.notifier;
};
kidModel.prototype.getUsernamAndName = function (kid, callbackErrorAndUsername) {

    connection.query('select username,firstName,lastName from children where kid=?', [kid], function (err, rows) {
        if (err != null) {
            callbackErrorAndUsername(err);
            return;
        }
        if (rows.length == 0) {
            callbackErrorAndUsername("invalid kid");
            return;
        }
        callbackErrorAndUsername(null, {
            'username': rows[0]['username'],
            'first_name': rows[0]['firstName'],
            'last_name': rows[0]['lastName']
        });

    });

};

kidModel.prototype.getInitialInformation = function (kid, callbackErrorInitialObjectParameter) {

    var promiseEvents = new promise(function (resolve, reject) {
        this.getEvents(kid, -1, function (events) {
            resolve(events);
            //callbackInitialObjectParameter({'error': null})
        }, function (err) {
            reject(err);
            //callbackInitialObjectParameter({'error': err});
        });
    }.bind(this));

    var promiseUsernameOfKid = new promise(function (resolve, reject) {
        this.getUsernamAndName(kid, function (error, usernameAndName) {
            if (error) {
                reject(error);
                return;
            }
            resolve(usernameAndName);
        });

    }.bind(this));
    promise.all([promiseUsernameOfKid, promiseEvents]).then(function (values) {
        var initial_object = {
            'credentials': values[0],
            'events': values[1],
            'kid':kid
        };
        process.nextTick(function () {
            callbackErrorInitialObjectParameter(null, initial_object)
        });
    }).catch(function (error) {
        process.nextTick(function () {
            callbackErrorInitialObjectParameter(error);
        });
    });

};
kidModel.prototype.getNotifications = function (kid, lastTimestamp, callbackErrorAndNewEvents) {

    this.getEvents(kid, lastTimestamp, function (events) {

        var arrayKeys = Object.keys(events);
        if ((Object.keys(events)).length != 0) {
            console.log((Object.keys(events)).lenght);
            process.nextTick(function () {
                callbackErrorAndNewEvents(null, events);
            });
            return;
        }
        var functionToUnsubscribe = this.subscribe(kid, function (listenedEvents) {
            this.unsubscribe(kid, functionToUnsubscribe);
            process.nextTick(function () {
                callbackErrorAndNewEvents(null, listenedEvents);
            });
        }.bind(this));


    }.bind(this), function (error) {
        process.nextTick(function () {
            callbackErrorAndNewEvents(error);
        });
    });
};
/*
 kidModel.prototype.getTargets = function (callback) {

 var callbackToAdd = function () {
 var targetsToPrint = this.kidTargets.map(function (element) {
 return element.print();
 });
 callback(this.kidTargets);
 }.bind(this);
 this.callOrWaitInitialization(callbackToAdd);

 }
 */
kidModel.prototype.locationOfUser = function (kid, callbackOK, callbackError) {
    connection.query('select latitude,longitude,timestamp from kid_location where kid=?', [kid], function (err, rows, fields) {
        if (err)callbackError(err);
        else callbackOK(rows[0]);
    });

};
kidModel.prototype.parents_dynamic_target = function (kid, timestamp, callbackOK, callbackError) {
    connection.query('select dtid,pid,latitude,longitude,timestamp from dynamic_target where kid=?', [kid], function (err, rows) {
        if (err)
            callbackError(err);
        else {
            callbackOK(rows);
        }
    });
};

kidModel.prototype.staticTargetsOfKid = function (kid, callbackOK, callbackError) {
    connection.query('select static_target_id,longitude,latitude,radius,creation_date from static_target where kid=' + kid, function (err, rows, fields) {
        if (err)callbackError.call(this);
        else callbackOK.call(this, rows);
    });
};
kidModel.prototype.validUser = function (username, password, callbackOK, callbackError) {
    selectQuery = 'select kid from children';
    var idName = 'kid';
    connection.query('select kid from children where username=? and passwordHash=?', [username, password], function (err, rows, fields) {
        console.log(err);
        if (rows === undefined || rows.length === 0)
            callbackError();
        else callbackOK(rows[0][idName]);
    });
};
kidModel.prototype.getEvents = function (kid, timestampLastInfo, callbackOK, callbackError) {//

    connection.beginTransaction(function (err) {
        var promiseKidLocation = new promise(function (resolve, reject) {
            this.locationOfUser(kid, function (kidLocationAndTimestamp) {
                if (timestampLastInfo == undefined) {
                    resolve(undefined);
                    return;
                }
                if (timestampLastInfo < kidLocationAndTimestamp['timestamp'])
                    resolve(kidLocationAndTimestamp);
                else resolve(undefined);
            }.bind(this), function (err) {
                reject(err);
            }.bind(this));
        }.bind(this));
        /* var promiseDynamicTargets = new promise(function (resolve, reject) {
         this.parents_dynamic_target(kid, function (array) {
         resolve(array);
         }, function (err) {
         reject(err);
         });
         });
         */


        var promiseStaticTargets = new promise(function (resolve, reject) {

            this.staticTargetsOfKid(kid, function (array) {
                array = array.filter(function (object) {
                    if (object['creation_date'] > timestampLastInfo)
                        return true;
                    return false;
                });
                if (array.length != 0) {
                    resolve(array);

                }
                else resolve(undefined);

            }.bind(this), function (err) {
                reject(err);
            });
        }.bind(this));


        promise.all([promiseKidLocation /*, promiseDynamicTargets*/, promiseStaticTargets]).then(function (values) {
            var object = {};
            if (values[0] != undefined) {
                object["location"] = values[0];
            }
            if (values[1] != undefined) {
                object["static-targets"] = values[1];
            }
            process.nextTick(function () {
                callbackOK(object);
            });
        }).catch(function (error) {
            console.log(error);
        });

    }.bind(this));
    /*
     var kidInfo = {};
     var newTargets = this.kidTargets.filter(function (obj) {
     if (obj.date >= timestampLastInfo) {
     return true;
     }
     return false;
     }).map(function (element) {
     return element.print();
     });
     var anyThingNew = false;
     if (timestampLastInfo <= this.location.timestamp) {
     kidInfo['location'] = this.location.print();
     kidInfo['permittedLocation'] = isInPermittedLocation(this.location, this.kidTargets);
     anyThingNew = true;
     }
     if (newTargets.length != 0) {

     kidInfo['targets'] = newTargets;
     anyThingNew = true;
     }
     kidInfo['kid'] = this.id;
     if (anyThingNew)
     callback(kidInfo);
     else callback(undefined);
     */
};


kidModel.prototype.hasGoneOffline = function () {


};

kidModel.prototype.targetStateChanged = function (target) {
    //TODO NU E BUNA
    this.notifier.publish(target.print());
};
kidModel.prototype.deleteTarget = function (kid, targetID, callbackOK, callbackError) {
    var sql_query = 'UPDATE static_target set status=1,timestamp=? where static_target_id=?';
    var timestamp = Date.now();
    connection.query(sql_query, [timestamp, targetID], function (err, rows, fields) {
        if (err) {
            callbackError(err);
        }
        var object = {
            'status': 'deleted',
            'timestamp': timestamp,
            'static_target_id': targetID
        };
        callbackOK(object);
        var notifier = PubSubFactory(channels.getChildChannelName(), kid);
        notifier.publish(object);

    }.bind(this));
};
kidModel.prototype.updateTarget = function (targetID, radius, latitude, longitude, callbackOK, callbackError) {
    var timestamp = Date.now();
    var sql_query = 'UPDATE static_target set status=1,timestamp=? where static_target_id=?';
    connection.query(sql_query, [timestamp, targetID], function (err, rows, fields) {
        if (err) {
            callbackError(err);
        }
        if (rows.affectedRows == 0) {
            callbackError('invalid target');
        }
        var updated_target = {
            'static-target': {
                'radius': radius,
                'latitude': latitude,
                'longitude': longitude,
                'static_target_id': targetID,
                'timestamp': timestamp
            }
        };
        callbackOK(updated_target);
        var notifer = PubSubFactory(channels.getChildChannelName(), this.id);
        notifer.publish(updated_target);

    }.bind(this));


};


//PRIVATE


kidModel.prototype.add_static_target = function (kid, longitude, latitude, radius, callback_error) {

    var date = Date.now();

    connection.query('insert into static_target(kid,latitude,longitude,radius,creation_date,status) values(?,?,?,?,0)', [kid, latitude, longitude, radius, date], function (err, rows) {
        if (err)
            callback_error(err);
        else {
            connection.query('SELECT LAST_INSERT_ID()', function (err, rows) {

                var object_to_send = {
                    'static_target_id': rows[0]['LAST_INSERT_ID()'],
                    'longitude': longitude,
                    'latitude': latitude,
                    'radius': radius,
                    'timestamp': date
                };
                callbackOK(object_to_send);
            });

        }
    });

};


kidModel.prototype.dynamic_target_changed = function () {

};

module.exports = kidModel;
