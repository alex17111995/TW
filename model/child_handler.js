/**
 * Created by Ciubi on 24/04/16.
 */
var promise = require('promise');
var delayedCallbacks = require('./delayedCallbacks');
var object_location = require('./object_location');
var PubSubFactory = require('../FactoryPubSub');
var channels = require('../channels');
var connection = require('./dbconnect');
var kidMode = require('./kidModel');
var notifications_parameters = require('../notifications_parameters');
var oracleConn = require('../oracleconnect');
var oracledb = require('oracledb');
var jsonFormats = require('../jsonFormats')
var child_handler = function () {
    console.log("debug");
    return this;
};

var static_targets_of_parent_children = function (pid) {

    return new promise(function (resolve, reject) {
        oracleConn.execute_SQL_leave_connection('BEGIN pack_kid_restrictions.get_static_targets_of_children(:pid, :cursor,:last_id); END;',
            {
                'pid': pid,
                'cursor': {type: oracledb.CURSOR, dir: oracledb.BIND_OUT},
                'last_id': {type: oracledb.INTEGER, dir: oracledb.BIND_OUT}
            }
        ).then(function (resultsAndConnection) {
            var cursor = resultsAndConnection.results.outBinds.cursor;
            oracleConn.getCursorResults(cursor, resultsAndConnection.connection).then(function (rows) {
                jsonFormats.format_static_targets(resultsAndConnection.results.outBinds.last_id, rows).then(
                    function (static_targets) {
                        resolve(static_targets);
                    }
                ).catch(function (error) {
                    reject(error);
                });

                oracleConn.releaseConnection(resultsAndConnection.connection)
            }).catch(function (err) {
                oracleConn.releaseConnection(resultsAndConnection.connection);
                reject(err);
            });
        }).catch(function (err) {
            reject(err);
        });

    });

};


var static_target_changes = function (pid, last_id) {

    return new promise(function (resolve, reject) {
        oracleConn.execute_SQL_leave_connection('BEGIN pack_kid_restrictions.get_changes_st_tar_kids(:pid, :cursor,:last_id); END;',
            {
                'pid': pid,
                'cursor': {type: oracledb.CURSOR, dir: oracledb.BIND_OUT},
                'last_id': {val: last_id, type: oracledb.INTEGER, dir: oracledb.BIND_INOUT}
            }
        ).then(function (resultsAndConnection) {
            var cursor = resultsAndConnection.results.outBinds.cursor;
            oracleConn.getCursorResults(cursor, resultsAndConnection.connection).then(function (rows) {
                jsonFormats.format_static_targets(resultsAndConnection.results.outBinds.last_id, rows).then(
                    function (static_targets) {
                        resolve(static_targets);
                    }
                ).catch(function (error) {
                    reject(error);
                });

                oracleConn.releaseConnection(resultsAndConnection.connection)
            }).catch(function (err) {
                oracleConn.releaseConnection(resultsAndConnection.connection);
                reject(err);
            });
        }).catch(function (err) {
            reject(err);
        });

    });

};

var publish_new_location_on_tracked_children_pubsub = function (pid, latitude, longitude, isOnline, timestamp) {
    oracleConn.executeSQL('select kid from dynamic_targets where pid=:pid',{
        pid:pid
    }).then(function (results) {
            for (var i = 0; i < results.rows.length; ++i) {
                var notifier = PubSubFactory(channels.getChildChannelName(), results.rows[i]);
                notifier.publish({
                    channel: 'update_dynamic_target_location',
                    data: {
                        pid: pid,
                        latitude: latitude,
                        longitude: longitude,
                        is_online: isOnline,
                        timestamp_last_update: timestamp
                    }
                });
            }
        })
        .catch(function (error) {
            console.log(error.message);
        });
};


child_handler.prototype.getChildren = function (pid, callbackOK, callbackError) {
    //callback

    new promise(function (fulfill, reject) {
        connection.query('select kid from child_handlers where pid=?', [pid], function (err, rows, fields) {
            if (err) reject(err);
            else
                fulfill(rows);
        });

    }).then(function (array) {
        callbackOK(array);
    }).catch(function (err) {
        callbackError(err);
    });
};
child_handler.prototype.getInformation = function (callback) {
    var callbackToAdd = function () {
        this.getChildren(function (children) {
            var promiseArray = [];
            for (var i = 0; i < children.length; i++) {
                var promiseChild = new promise(function (resolve, reject) {
                    children[i].getInformation(-1, function (kidInfo) {
                        resolve(kidInfo);
                    });
                });
                promiseArray.push(promiseChild);
            }
            promise.all(promiseArray).then(function (arrayChildren) {
                //TODO NUMELE

                callback({"type": "parent", "kids": arrayChildren, "username": "hardcoded"});
            }).catch(function (rekt) {
                callback(rekt);
            });
        });
    }.bind(this);
    this.callOrWaitInitialization(callbackToAdd);
};
child_handler.prototype.getUsernameAndName = function (pid, callbackErrorAndUsername) {

    connection.query('select username,firstName,lastName from parents where pid=?', [pid], function (err, rows) {
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


child_handler.prototype.getInitialInformation = function (pid, callbackErrorInitialObjectParameter) {

    var promiseEvents = new promise(function (resolve, reject) {


    }.bind(this));

    var promiseUsernameOfKid = new promise(function (resolve, reject) {
        this.getUsernameAndName(pid, function (error, usernameAndName) {
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
            'events': values[1]
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

child_handler.prototype.getEvents = function (pid, lastTimestamp, callback) {
    var parentInstance = this;
    this.getChildren(pid, function (children) {
        var promiseArray = [];
        const kid_model = new kidMode();
        for (var i = 0; i < children.length; i++) {
            var promiseChild = new promise(function (resolve, reject) {

                kid_model.getEvents(children[i]['kid'], lastTimestamp, function (kidInfo) {
                    if (kidInfo != undefined)
                        resolve({'kid': children[i], 'events': kidInfo});
                    else resolve(undefined);
                });
            });
            promiseArray.push(promiseChild);
        }
        promise.all(promiseArray).then(function (arrayChildren) {
            var arrayWithoutUndefiened = arrayChildren.filter(function (object) {
                if (object == undefined)
                    return false;
                return true;

            });
            callback({'children': arrayWithoutUndefiened});
            // else this.listenChildrenForEvent(callback);


        }.bind(parentInstance)).catch(function (rekt) {
            callback({'error': rekt});
        });
    }.bind(this));
};


child_handler.prototype.get_notifications = function (pid) {
    //TODO assure not duplicates
    return new promise(function (resolve, reject) {
        resolve({});
    });

};


child_handler.prototype.get_new_notifications = function (pid, notification_types_required) {
    return new promise(function (resolve, reject) {

        var keys = Object.keys(notification_types_required);
        var promises_db_queries = [];
        for (var i = 0; i < keys.length; ++i) {
            switch (keys[i]) {
                case notifications_parameters.static_targets_query_string():
                {
                    var promise_static_targets = static_target_changes(pid, notification_types_required[keys[i]]);
                    promises_db_queries.push(promise_static_targets);
                }
            }
        }
        promise.all(promises_db_queries).then(function (values) {
            resolve(values);
        }).catch(function (error) {
            reject(error);
        });

    });
};
child_handler.prototype.get_children_of_handler = function (pid) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('select kid,permission,username,firstname,lastname from child handlers natural join children where pid=:pid and permission>0',
            {
                pid: pid
            }).then(function (results) {
            var resultsToReturn = [];
            for (var i = 0; i < results.rows; i++) {
                resultsToReturn.push({
                    'kid': results.rows[i][0],
                    'permission': results.rows[i][1],
                    'username': results.rows[i][2],
                    'first_name': results.rows[i][3],
                    'last_name': results.rows[i][4]
                });
            }
            resolve(resultsToReturn);

        }).catch(function (error) {
            reject(error);
        });
    });

};


child_handler.prototype.updateLocation = function (pid, information, callbackSuccessfulUpdated) {
    //TODO UPDATE DB
    return new promise(function (resolve, reject) {

        oracleConn.executeSQL('BEGIN update_location_parent(:pid,:latitude,:longitude,1,:timestamp_out); END;', {
            pid: pid,
            latitude: information['latitude'],
            longitude: information['longitude'],
            timestamp_out: {type: oracledb.STRING, dir: oracledb.BIND_OUT}
        }).then(function (results) {
                publish_new_location_on_tracked_children_pubsub(pid, information['latitude'],
                    information['longitude'], 1, results.outBinds.timestamp_out);
                resolve(true);

            })
            .catch(function (error) {
                console.log(error.message);
                reject(error)
            });
    });

};
child_handler.prototype.hasGoneOffline = function () {
    return 0;
};

module.exports = child_handler;


