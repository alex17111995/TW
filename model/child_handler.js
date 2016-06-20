/**
 * Created by Ciubi on 24/04/16.
 */

var promise = require('promise');
var delayedCallbacks = require('./delayedCallbacks');
var object_location = require('./object_location');
var PubSubFactory = require('../FactoryPubSub');
var channels = require('../channels');
var kidModel = require('./kidModel');
var notifications_parameters = require('../notifications_parameters');
var oracleConn = require('../oracleconnect');
var oracledb = require('oracledb');
var jsonFormats = require('../jsonFormats');
var notifierFunctions = require('../notifier_functions');
var child_handler = function () {
    return this;
};
var validations = require('./validations');
var geoFancing = require('./geo_fencing');
var mapTimeouts = new Map();
var clearTimeoutId = function (kid) {
    if (mapTimeouts.get(kid) != undefined) {
        clearTimeout(mapTimeouts.get(kid));
        mapTimeouts.delete(kid);
    }
};


var setTimeoutId = function (kid, timeout) {
    mapTimeouts.set(kid, timeout);
};


//TODO REMAKE THIS


var children_of_dynamic_target = function (pid) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('select kid from child_handlers where pid=:pid and is_dynamic_target=1', {pid: pid})
            .then(function (results) {
                resolve(results.rows.map(function (row) {
                    return row[0];
                }));

            })
            .catch(function (error) {
                reject(error);
            });
    });
};

var update_location = function (pid, latitude, longitude) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('BEGIN update_location_parent(:pid,:latitude,' +
            ':longitude,:timestamp_out,:array_children); END;', {
            pid: pid,
            latitude: latitude,
            longitude: longitude,
            timestamp_out: {
                type: oracledb.STRING, dir: oracledb.BIND_OUT
            },
            array_children: {
                type: oracledb.NUMBER, dir: oracledb.BIND_OUT, maxArraySize: 1000
            }

        }).then(function (results) {
                var array_children = results.outBinds.array_children;

                for (var i = 0; i < array_children.length; ++i) {
                    var notifierKid = PubSubFactory.publish_if_existing(channels.getChildChannelName(), array_children[i],
                        {
                            channel: 'dynamic_target_new_location',
                            'data': {
                                kid: array_children[i],
                                pid: pid,
                                latitude: latitude,
                                longitude: longitude,
                                timestamp: results.outBinds.timestamp_out
                            }
                        });

                    geoFancing(array_children[i]);
                }


                resolve(true);

            })
            .catch(function (error) {
                reject(error);
            });
    });
};


var onOffline = function (pid) {
    // clearTimeoutId(kid);
    mapTimeouts.delete(pid);
    children_of_dynamic_target(pid).then(function (children) {
            for (var i = 0; i < children.length; ++i) {
                PubSubFactory.publish_if_existing(channels.getChildChannelName(), children[i]
                    , {
                        channel: 'offline_dynamic_target',
                        data: {
                            'kid': children[i],
                            'pid': pid
                        }
                    });
            }
        })
        .catch(function (error) {
            console.log(error);
        });

    // var notifier = PubSubFactory(channels.getChildChannelName(), kid);
    /* notifier.publish({
     channel: 'offline_child',
     data: {
     'kid': kid
     }
     });
     */
};

var get_notifications_of_children = function (subscribed_children) {
    return new promise(function (resolve, reject) {
        var kid_model = new kidModel();
        var promises = [];
        for (var i = 0; i < subscribed_children.length; i++) {
            promises.push(kid_model.get_notifications(subscribed_children[i].kid));

        }
        promise.all(promises).then(function (children) {
                resolve(children);
            })
            .catch(function (error) {
                reject(error);
            });

    });
};
var get_subscribed_and_pending_children_and_subscribed_notifications = function (pid) {
    return new promise(function (resolve, reject) {
        get_children_of_handler(pid).then(function (children_of_handler) {
                get_notifications_of_children(children_of_handler)
                    .then(function (children_notification_list) {
                        resolve(
                            children_notification_list
                        );

                    }).catch(function (error) {
                    reject(error);
                });


            })
            .catch(function (error) {
                reject(error);
            });


    }.bind(this));

}; //DEPRECATED

var get_user_information = function (pid) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('select pid,username,firstname,lastname from parents where pid=:pid', {
            pid: pid
        }).then(function (results) {
            if (results.rows.length == 0) {
                reject(new Error('invalid-user'));
            }
            else {
                resolve({
                    pid: results.rows[0][0],
                    username: results.rows[0][1],
                    first_name: results.rows[0][2],
                    last_name: results.rows[0][3]
                });
            }
        });
    });
};


child_handler.prototype.get_notifications = function (pid) {
    return new promise(function (resolve, reject) {
        var promise_username = get_user_information(pid);
        var promise_children = get_subscribed_and_pending_children_and_subscribed_notifications(pid);
        promise.all([promise_username, promise_children]).then(function (values) {
            resolve({
                'credentials': values[0],
                'children': values[1]
            });


        }).catch(function (err) {
            reject(err);

        });
    });
};


var get_children_of_handler = function (pid) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('select kid,username,firstname,lastname from child_handlers natural join children where pid=:pid',
            {
                pid: pid
            }).then(function (results) {
            var resultsToReturn = [];
            for (var i = 0; i < results.rows.length; i++) {
                resultsToReturn.push({
                    'kid': results.rows[i][0],
                    'username': results.rows[i][1],
                    'first_name': results.rows[i][2],
                    'last_name': results.rows[i][3]
                });
            }
            resolve(resultsToReturn);

        }).catch(function (error) {
            reject(error);
        });
    });

};

child_handler.prototype.isOnline = function (pid) {
    return mapTimeouts.get(pid) != undefined;
};
child_handler.prototype.get_email_of_username = function (username) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('SELECT email from parents where username=:username and type=0',
            {
                username: username
            })
            .then(function (results) {
                if (results.rows.length === 0) {
                    reject(new Error('invalid username'));
                    return;
                }
                resolve(results.rows[0][0]);

            })
            .catch(function (error) {
                reject(error);
            });
    });

};

child_handler.prototype.register_kid = function (pid, information) {
    return new promise(function (resolve, reject) {

        oracleConn.executeSQL('BEGIN pack_auth.register_child(:pid,:username,:password,:first_name,:last_name,:kid);END;',
            {
                pid: pid,
                username: information['username'],
                password: information['password'],
                first_name: information['first_name'],
                last_name: information['last_name'],
                kid: {type: oracledb.NUMBER, dir: oracledb.BIND_OUT}

            })
            .then(function (result) {
                resolve('OK');
                PubSubFactory.publish_if_existing(channels.getParentAdministrativeChannel(), pid
                    , {
                        'channel': 'new_child',
                        'kid': result.outBinds.kid
                    });

            })
            .catch(function (error) {
                reject(error);

            });
    });

};


child_handler.prototype.kids_nearby = function (pid, kid) {
    return new promise(function (resolve, reject) {
        oracleConn.getConnection()
            .then(function (connection) {
                verify_rights(connection, pid, kid)
                    .then(function () {
                        return oracleConn.execute_query_connection(connection, 'select latitude,longitude from child_location' +
                            'where kid=:kid and is_online=1', {kid: kid}, {autoCommit: true})
                    })
                    .then(function (result) {
                        if (result.rows.length == 0) {
                            reject(new Error('kid is offline'))
                        }
                        return oracleConn.execute_query_connection(connection, 'select kid,username,firstname,lastname from children' +
                            ' natural join children_location where distance(:latitude,:longitude,latitude,longitude)<100 ' +
                            'and is_online=1', {
                            latitude: result.rows[0],
                            longitude: result.rows[1]
                        }, {autoCommit: true});
                    }).then(function (kid_username_first_name_lastName) {
                        var array_object = [];
                        for (var i = 0; i < kid_username_first_name_lastName.rows.length; ++i) {
                            array_object.push({
                                kid: kid_username_first_name_lastName[i][0],
                                username: kid_username_first_name_lastName[i][1],
                                first_name: kid_username_first_name_lastName[i][2],
                                last_name: kid_username_first_name_lastName[i][3]
                            });
                        }
                        resolve(array_object);
                        oracleConn.releaseConnection(connection);
                    })
                    .catch(function (error) {
                        oracleConn.releaseConnection(connection);
                        reject(error);
                    });


            })
            .catch(function (error) {
                reject(error);
            });

    });

};


child_handler.prototype.updateLocation = function (pid, information) {

    return new promise(function (resolve, reject) {

        update_location(pid, information['latitude'], information['longitude'], 1)
            .then(function (results) {
                clearTimeoutId(pid);
                var timeoutID = setTimeout(function () {
                    onOffline(pid)
                }, 1000 * 60 * 1 / 4);
                setTimeoutId(pid, timeoutID);
                resolve(true);
            })
            .catch(function (error) {
                console.log(error.message);
                reject(error);
            });


    });
};

var username_and_name_user_of_parent = function (connection, pid) {
    return new promise(function (resolve, reject) {
        connection.execute('select username,firstname,lastname from parents where pid=:pid', {

                pid: pid
            }
        ).then(function (results) {
                if (results.rows.length == 0)
                    reject(new Error('Invalid pid'));
                else resolve(results.rows[0]);

            })
            .catch(function (error) {
                reject(error);
            });
    });
};


var verify_rights = function (connection, pid, kid) {
    return new promise(function (resolve, reject) {
        connection.execute('SELECT COUNT(*) from child_handlers where pid=:pid and kid=:kid',
            {
                kid: kid,
                pid: pid
            }, {autoCommit: true}).then(function (results) {
                if (results.rows[0] == 0) {
                    reject(new Error('no permission'));
                }
                else resolve();
            })
            .catch(function (error) {
                reject(error);
            });
    });
};

child_handler.prototype.delete_parent_of_child = function (pid_granting_access, pid_to_delete, kid) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('delete from child_handlers where kid=:kid and pid=:pid_to_delete' +
                ' and (SELECT COUNT(*) from child_handlers where kid=:kid and pid=:pid_granting)>0', {
                kid: kid,
                pid_to_delete: pid_to_delete,
                pid_granting: pid_granting_access
            })
            .then(function (results) {
                if (results.rowsAffected == 0) {
                    reject(new Error('no permission'));
                }
                else {
                    PubSubFactory.publish_if_existing(channels.getParentAdministrativeChannel()
                        , pid_to_delete, {
                            'channel': 'deleted_child',
                            data: {
                                'kid': kid
                            }
                        });
                    PubSubFactory.publish_if_existing(channels.getChildChannelName(), kid
                        , {
                            'channel': 'deleted_parent',
                            'data': {
                                kid: kid,
                                'pid': pid_to_delete

                            }
                        });

                    resolve(true);

                }
            })
            .catch(function (error) {
                reject(error);
            });
    });
};
child_handler.prototype.no_longer_dynamic_target = function (pid_with_kid_acces, kid) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('UPDATE child_handlers set is_dynamic_target = null where kid=:kid and pid=:pid and is_dynamic_target is not null',
            {
                kid: kid,
                pid: pid_with_kid_acces
            })
            .then(function (results) {
                if (results.rowsAffected == 0) {
                    reject(new Error('no permission'));
                    return;
                }
                PubSubFactory.publish_if_existing(channels.getChildChannelName(), kid, {
                    channel: 'deleted_dynamic_target',
                    data: {
                        kid: kid,
                        pid: pid_with_kid_acces
                    }
                });
            });
        geoFancing(kid);
    });

};


child_handler.prototype.make_parent_dynamic_target = function (pid_with_kid_access, kid, radius) {
    var thisInstance = this;
    return new promise(function (resolve, reject) {
        if (!validations.validate_new_dynamic(pid_with_kid_access, kid, radius)) {
            reject(new Error('invalid parameters'));
            return;
        }
        oracleConn.getConnection()
            .then(function (connection) {
                connection.execute('UPDATE child_handlers set is_dynamic_target =1,radius_dynamic_target=:radius where kid=:kid and pid=:pid',
                    {
                        pid: pid_with_kid_access,
                        kid: kid,
                        radius: radius
                    })
                    .then(function (results) {
                        if (results.rowsAffected == 0) {
                            throw new Error('no permission');
                        }
                        return oracleConn.execute_query_connection(connection, 'SELECT latitude,longitude,last_timestamp_update from parents_location where pid=:pid',
                            {
                                pid: pid_with_kid_access
                            });
                    })
                    .then(function (results) {
                        oracleConn.commit_and_close(connection).then(function () {
                                var latitude, longitude, timestamp_last_update;

                                if (results.rows.length == 0) {
                                    latitude = undefined;
                                    longitude = undefined;
                                    timestamp_last_update = undefined;
                                }
                                else {

                                    latitude = results.rows[0][0];
                                    longitude = results.rows[0][1];
                                    timestamp_last_update = results.rows[0][2];

                                }
                                PubSubFactory.publish_if_existing(channels.getChildChannelName(), kid, {
                                    channel: 'new_dynamic_target',
                                    data: {
                                        kid: kid,
                                        pid: pid_with_kid_access,
                                        latitude: latitude,
                                        longitude: longitude,
                                        is_online: thisInstance.isOnline(pid_with_kid_access),
                                        timestamp_last_update: timestamp_last_update,
                                        radius: radius
                                    }
                                });
                                geoFancing(kid);
                                resolve(true);
                            })
                            .catch(reject(new Error('error commiting')));


                    })
                    .catch(function (error) {
                        oracleConn.rollback_and_close(connection).then(function () {
                            reject(error);
                        });
                    });

            }).catch(function (error) {
            reject(error);
        });

    });
}
;

child_handler.prototype.add_parent_to_child = function (pid_to_add, kid) {
    return new promise(function (resolve, reject) {
        return oracleConn.getConnection()
            .then(function (connection) {

                oracleConn.execute_query_connection(connection, 'insert into child_handlers(kid,pid) values (:kid,:pid)',
                    {
                        pid: pid_to_add,
                        kid: kid
                    })
                    .then(function () {
                        return username_and_name_user_of_parent(connection, pid_to_add)
                    })
                    .then(function (results) {
                        return new promise(function (resolve, reject) {
                            oracleConn.commit_and_close(connection).then(function () {
                                    resolve(results);
                                })
                                .catch(function (error) {
                                    reject(error);
                                });
                        });
                    })
                    .then(function (results) {
                        PubSubFactory.publish_if_existing(channels.getParentAdministrativeChannel(), pid_to_add, {
                            'channel': 'new_child',
                            'kid': kid
                        });
                        PubSubFactory.publish_if_existing(channels.getChildChannelName(), kid, {
                            'channel': 'new_parent',
                            'data': {
                                kid: kid,
                                pid: pid_to_add,
                                'username': results[0],
                                'first_name': results[1],
                                last_name: results[2]
                            }
                        });
                        resolve(true);
                    })
                    .catch(function (error) {
                        oracleConn.rollback_and_close(connection).then(function () {
                                reject(error);
                            })
                            .catch(function () {
                                reject(error);
                            });

                    });
            })
            .catch(function (error) {
                reject(error);
            });

    });

};


child_handler.prototype.add_static_target = function (pid, kid, longitude, latitude, radius) {
    return new promise(function (resolve, reject) {
        var static_target_id = 0;
        if (!validations.validate_new_static_target(kid, pid, latitude, longitude, radius)) {
            reject(new Error('invalid parameters'));
            return;
        }
        oracleConn.executeSQL('BEGIN pack_kid_restrictions.add_static_restriction(:pid,:kid,:latitude,:longitude,:radius,:id_static); END;',
            {
                pid: pid,
                kid: kid,
                latitude: latitude,
                longitude: longitude,
                radius: radius,
                id_static: {type: oracledb.NUMBER, dir: oracledb.BIND_OUT},
            })
            .then(function (results) {
                static_target_id = results.outBinds.id_static;
                var notifier = PubSubFactory.publish_if_existing(channels.getChildChannelName(), kid, {
                    channel: 'new_static_target',
                    data: {
                        'kid': kid,
                        'latitude': latitude,
                        'longitude': longitude,
                        'radius': radius,
                        'static_target_id': static_target_id
                    }
                });

                geoFancing(kid);
                resolve({
                    'kid': kid,
                    'latitude': latitude,
                    'longitude': longitude,
                    'changed_geo': changed_geo
                });

            }).catch(function (error) {
            reject(error);
        });
    });
};


child_handler.prototype.delete_static_target = function (pid, static_id) {

    return new promise(function (resolve, reject) {
        if (!validations.validate_delete_static_target(static_id, pid)) {
            reject(new Error('invalid parameters'));
            return;
        }
        oracleConn.executeSQL('BEGIN pack_kid_restrictions.delete_static_restriction(:pid,:static_id,:kid) ;END;', {
            pid: pid,
            static_id: static_id,
            kid: {type: oracledb.NUMBER, dir: oracledb.BIND_OUT}

        }).then(function (results) {

                var notifier = PubSubFactory.publish_if_existing(channels.getChildChannelName(), results.outBinds.kid, {
                    channel: 'deleted_static_target',
                    data: {
                        static_id: static_id,
                        kid: results.outBinds.kid
                    }
                });

                geoFancing(results.outBinds.kid);
                resolve({
                    static_id: static_id,
                    kid: results.outBinds.kid
                });
            })
            .catch(function (error) {
                reject(error);
            });

    });

};

child_handler.prototype.get_tracked_children_ids = function (pid) {
    return new promise(function (resolve, reject) {
        get_children_of_handler(pid).then(function (children) {
            resolve(children.map(function (element) {
                return element.kid;
            }));

        }).catch(function (error) {
            reject(error);
        });

    })
};

module.exports = child_handler;


