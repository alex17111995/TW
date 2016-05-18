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
var child_handler = function () {
}


child_handler.prototype.listenChildrenForEvent = function (pid, callback) {
    this.getChildren(pid, function (arrayKids) {
        const callbackNotifier = function (kidEvent) {
            this.unsubscribeChildren(callbackNotifier);
            callback(kidEvent);
        }.bind(this);
        for (var i = 0; i < arrayKids.length; i++) {
            var notifier = PubSubFactory(channels.getChildChannelName(), arrayKids[i]['kid']);
            notifier.subs(callbackNotifier);
        }
    });
};

child_handler.prototype.unsubscribe_children = function (callbackNotifier) {

}
child_handler.prototype.validUser = function (username, password, callbackOK, callbackError) {
    connection.query('select pid from parents where username=? and passwordHash=?', [username, password], function (err, rows, fields) {
        console.log(err);
        if (rows === undefined || rows.length === 0)
            callbackError(err);
        else callbackOK(rows[0]['pid']);
    });
};

child_handler.prototype.unsubscribe_children = function (callback) {
    for (var i = 0; i < this.kids.length; i++) {
        var notifier = this.kids[i].getNotifier();
        notifier.unsubscribe(callback);
    }
};


child_handler.prototype.stopListeningForEvent = function (callback) {
    for (var i = 0; i < this.kids.length; i++) {
        var notifier = this.kids[i].getNotifier();
        notifier.unsubscribe(callback)
    }
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
                callback({'children':arrayWithoutUndefiened});
            // else this.listenChildrenForEvent(callback);


        }.bind(parentInstance)).catch(function (rekt) {
            callback({'error': rekt});
        });
    }.bind(this));
};

child_handler.prototype.updateLocation = function (pid, information, callbackSuccessfulUpdated) {
    //TODO UPDATE DB
    connection.beginTransaction(function (err) {
        connection.query('select COUNT(*) from parent_location where pid=?', [pid], function (err, rows, fields) {
            var timestamp = Date.now();
            var sql_query = 'update parent_location set timestamp=? , latitude=? , longitude=? where pid=?';
            if (err) {
                process.nextTick(function () {
                    callbackSuccessfulUpdated(err)
                });
                return;
            }
            if (rows[0]['COUNT(*)'] == 0) {
                sql_query = 'insert into parent_location(timestamp,latitude,longitude,pid) values(?,?,?,?)';
            }
            connection.query(sql_query, [timestamp, information['latitude'], information['longitude'], pid], function (err, rows, fields) {

                var object = {
                    'longitude': information['longitude'],
                    'latitude': information['latitude'],
                    'online': true,
                    'timestamp': timestamp
                };
                connection.commit(function (err) {
                    if (err) {
                        return connection.rollback(function () {
                            throw  err
                        });
                    }
                    process.nextTick(function () {
                        var notifier = PubSubFactory(channels.getParentLocationChannel(), pid);
                        callbackSuccessfulUpdated(object);
                        notifier.publish(object);
                    }.bind(this));

                });
            }.bind(this), function (err) {
                process.nextTick(function () {
                    callbackSuccessfulUpdated(err)
                });
            }.bind(this));

        }.bind(this));
    }.bind(this));


};
child_handler.prototype.hasGoneOffline = function () {
    return 0;
};

module.exports = child_handler;


