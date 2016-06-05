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
var child_handler = function () {
    return this;
};

//TODO REMAKE THIS
var publish_new_location_on_tracked_children_pubsub = function (pid, latitude, longitude, isOnline, timestamp) {
    oracleConn.executeSQL('select kid from child_handlers where pid=:pid and is_dynamic_target is not null', {
        pid: pid
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
                        resolve({
                            children_notification_list
                        });

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
                resolve(results.rows[0]);
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
var username_and_name_user_of_child = function (connection, kid) {
    return new promise(function (resolve, reject) {
        connection.execute('select username,firstname,lastname from parents where kid=:kid', {

                kid: kid
            }
        ).then(function (results) {
                if (results.rows.length == 0)
                    throw error;
                else resolve(results.rows[0]);

            })
            .catch(function (error) {
                throw error;
            });
    });
};

var verify_rights = function (connection, pid, kid) {
    return new promise(function (resolve, reject) {
        connection.execute('SELECT COUNT(*) from child_handlers where pid=:pid and kid=:kid',
            {
                kid: kid,
                pid: pid
            }).then(function (results) {
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
                    var notifierParent = PubSubFactory(channels.getParentAdministrativeChannel(), pid_to_add);
                    var notifierKid = PubSubFactory(channels.getChildChannelName(), kid);
                    notifierParent.publish({
                            'channel': 'deleted_child',
                            'kid': kid
                        }
                    );
                    notifierKid.publish({
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
                var notifierKid = PubSubFactory(channels.getChildChannelName(), kid);
                notifierKid.publish({
                    channel: 'deleted_dynamic_target',
                    data: {
                        kid: kid,
                        pid: pid_with_kid_access
                    }

                });
            });
    });

};


child_handler.prototype.make_parent_dynamic_target = function (pid_with_kid_access, kid, radius) {
    return new promise(function (resolve, reject) {
        oracleConn.getConnection().then(function (connection) {
            connection.execute('UPDATE child_handlers set is_dynamic_target =1,radius_dynamic_target=:radius where kid=:kid and pid=:pid',
                {
                    pid: pid_with_kid_access,
                    kid: pid_with_kid_access
                }).then(function (results) {
                if (results.rowsAffected == 0) {
                    reject(new Error('no permission'));
                }
                connection.execute('SELECT latitude,longitude,is_online,last_timestamp_update where pid=:pid',
                    {
                        pid: pid_with_kid_access
                    }).then(function (results) {
                    oracleConn.commit_and_close(connection).then(function () {
                        var notifierKid = PubSubFactory(channels.getChildChannelName(), kid);
                        notifierKid.publish({
                            channel: 'new_dynamic_target',
                            data: {
                                kid: kid,
                                pid: pid_with_kid_access,
                                latitude: results.rows[0][0],
                                longitude: results.rows[0][1],
                                is_online: results.rows[0][2],
                                last_timestamp: results.rows[0][3],
                                radius: radius
                            }
                        });
                        resolve(true);
                    });

                });

            }).catch(function (error) {
                oracleConn.rollback_and_close(connection).then(function () {
                    reject(error);
                });
            });

        }).catch(function (error) {
            reject(error);
        });

    });
};

child_handler.prototype.add_parent_to_child = function (pid_parent_granting_access, pid_to_add, kid) {
    return new promise(function (resolve, reject) {
        return oracleConn.getConnection()
            .then(function (connection) {
                verify_rights(connection, pid_parent_granting_access, kid)
                    .then(function () {
                        return oracleConn.execute_query_connection(connection, 'insert into child_handlers(kid,pid) values (:kid,:pid)',
                            {
                                pid: pid_to_add,
                                kid: kid
                            });
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
                        var notifierParent = PubSubFactory(channels.getParentAdministrativeChannel(), pid_to_add);
                        var notifierKid = PubSubFactory(channels.getChildChannelName(), kid);
                        notifierParent.publish({
                                'channel': 'new_child',
                                'kid': kid
                            }
                        );
                        notifierKid.publish({
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

/*

 child_handler.prototype.request_kid_access = function (pid_sender, requested_kid, permission_required) {
 return new promise(function (resolve, reject) {
 if (permission_required < 0 || permission_required > 1) {
 reject(new Error('wrong permission'));
 }
 oracledb.getConnection().then(function (connection) {
 connection.execute('insert into child_handlers values(:kid,:pid,:permission',
 {
 kid: requested_kid,
 pid: pid_sender,
 permission: permission_required
 }).then(function () {

 var promiseChildInfo = username_and_name_user_of_child(connection, requested_kid);
 var promiseParentInfo = username_and_name_user_of_parent(connection, pid_sender);
 promise.all([promiseChildInfo, promiseParentInfo]).then(function (values) {
 oracleConn.commit_and_close(connection).then(function () {

 var notifierParent = PubSubFactory(channels.getParentAdministrativeChannel(), pid_sender);
 var notifierKid = PubSubFactory(channels.getChildChannelName(), requested_kid);
 notifierKid.publish({
 channel: 'parent_added',
 data: {
 kid: requested_kid,
 pid: pid_sender,
 username: values[1][0],
 first_name: values[1][1],
 last_name: values[1][2]
 }
 });
 notifierParent.publish({
 channel: 'kid_request',
 data: {
 kid: requested_kid,
 username: values[0][0],
 first_name: values[0][1],
 last_name: values[0][2]
 }
 });
 });
 });

 });
 }).catch(function (error) {
 oracleConn.rollback_and_close(connection);
 reject(error);
 });

 }).catch(function (error) {
 reject(error);
 });
 };
 */
child_handler.prototype.add_static_target = function (pid, kid, longitude, latitude, radius) {
    return new promise(function (resolve, reject) {
        var static_target_id = 0;
        oracleConn.executeSQL('BEGIN pack_kid_restrictions.add_static_restriction(:pid,:kid,:latitude,:longitude,:radius,:id_static); END;',
            {
                pid: pid,
                kid: kid,
                latitude: latitude,
                longitude: longitude,
                radius: radius,
                id_static: {type: oracledb.NUMBER, dir: oracledb.BIND_OUT}
            })
            .then(function (results) {
                static_target_id = results.outBinds.id_static;
                var notifier = PubSubFactory(channels.getChildChannelName(), kid);
                notifier.publish({
                    channel: 'new_static_target',
                    data: {
                        'kid': kid,
                        'latitude': latitude,
                        'longitude': longitude,
                        'radius': radius,
                        'static_target_id': static_target_id


                    }
                });
                resolve({
                    'kid': kid,
                    'latitude': latitude,
                    'longitude': longitude
                });

            }).catch(function (error) {
            reject(error);
        });
    });
};


child_handler.prototype.delete_static_target = function (pid, static_id) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL('BEGIN pack_kid_restrictions.delete_static_restriction(:pid,:static_id,:kid) ;END;', {
            pid: pid,
            static_id: static_id,
            kid: {type: oracledb.NUMBER, dir: oracledb.BIND_OUT}

        }).then(function (results) {
                var notifier = PubSubFactory(channels.getChildChannelName(), results.outBinds.kid);
                notifier.publish({
                    channel: 'deleted_static_target',
                    data: {
                        static_id: static_id,
                        kid: results.outBinds.kid
                    }
                });
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


