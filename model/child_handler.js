/**
 * Created by Ciubi on 24/04/16.
 */
var dbmodule = require('./dbconnect');
var promise= require('promise');
var childrenFactory = require('./childFactory');
var delayedCallbacks = require('./delayedCallbacks');
var util = require('util');

var child_handler = function (id) {
    this.id = id;
    this.kids = [];
    delayedCallbacks.call(this);
    dbmodule.kidsOfHandler(id, function (array) {
        var factory = childrenFactory();
        for (var i = 0; i < array.length; i++) {
            var kid = array[i]['kid'];
            var child_instance = factory.getInstance(array[i]['kid']);
            this.kids.push(child_instance);

        }
        this.markAsInitialized();
    }.bind(this), function () {
        this.kids = []
        this.markAsInitialized();
    }.bind(this));
    //TODO getKidsFromDB
    //TODO notifier
}
util.inherits(child_handler, delayedCallbacks);


child_handler.prototype.listenChildrenForEvent = function (callback) {
    for (var i = 0; i < this.kids.length; i++) {
        var notifier = this.kids[i].getNotifier();
        notifier.subs(function(kidEvent){
            this.unsubscribeChildren(this);
            callback(kidEvent);
        }.bind(this));
    }
}


child_handler.prototype.unsubscribeChildren = function (callback) {
    for (var i = 0; i < this.kids.length; i++) {
        var notifier = this.kids[i].getNotifier();
        notifier.unsubscribe(callback);
    }
}


child_handler.prototype.stopListeningForEvent = function (callback) {
    for (var i = 0; i < this.kids.length; i++) {
        var notifier = this.kids[i].getNotifier();
        notifier.unsubscribe(callback)
    }
}

child_handler.prototype.getChildren = function (callback) {
    var callbackToAdd = function () {
        callback.call(this, this.kids);
    }.bind(this);
    this.callOrWaitInitialization(callbackToAdd);
}


child_handler.prototype.getNotifications = function (lastTimestamp, callback) {
    var parentInstance=this;
    this.getChildren(function (children) {
        var promiseArray = [];
        for (var i = 0; i < children.length; i++) {
            var promiseChild = new promise(function (resolve, reject) {
                children[i].getKidInformation(lastTimestamp, function (kidInfo) {
                    resolve(kidInfo);
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
            if (arrayWithoutUndefiened.length != 0)
                callback(arrayWithoutUndefiened);

            this.listenChildrenForEvent(callback);


        }.bind(parentInstance)).catch(function (rekt) {
            callback({'error': rekt});
        });
    }.bind(this));
}


module.exports = child_handler;
