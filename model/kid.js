/**
 * Created by Ciubi on 26/03/16.
 */
var PubSubFactory = require('../FactoryPubSub');
var dbconnect = require('./dbconnect');
var staticTarget = require('./static_target');
var delayedCallbacks = require('./delayedCallbacks');
var util = require('util');
var promise = require('promise');
var object_location = require('./object_location');
var kidModel = function (id) {
    delayedCallbacks.call(this);
    this.id = id;
    this.syncedWithDB = false;
    this.notifier = PubSubFactory('kid', id);
    this.kidTargets = [];

    var arrayPromises = [];


    var promiseStaticTargets = new promise(function (resolve, reject) {

        dbconnect.staticTargetsOfKid(id, function (array) {
            for (var i = 0; i < array.length; i++) {
                var latitude = array[i]['latitude'];
                var longitude = array[i]['longitude'];
                var radius = array[i]['radius'];
                var targetID = array[i]['static_target_id'];
                var creationDate = array[i]['creation_date'];
                var targetInstance = new staticTarget(targetID, latitude, longitude, radius, creationDate);
                this.kidTargets.push(targetInstance);
            }
            resolve(1);

        }.bind(this), function () {
            reject('failDB static targets');
        }.bind(this));
    }.bind(this));
    var promiseKidLocation = new promise(function (resolve, reject) {
        dbconnect.locationOfKid(this.id, function (kidLocationAndTimestamp) {
            if (kidLocationAndTimestamp == undefined) {
                this.location = new object_location(this);
            }
            else {
                this.location = new object_location(this, kidLocationAndTimestamp['latitude'], kidLocationAndTimestamp['longitude'], 100, kidLocationAndTimestamp['timestamp']);
            }
            resolve(true);
        }.bind(this), function () {
            this.location = new object_location();
            reject();
        }.bind(this));
    }.bind(this));
    arrayPromises.push(promiseStaticTargets);
    arrayPromises.push(promiseKidLocation);

    promise.all(arrayPromises).then(function (values) {
        this.markAsInitialized();
        //HARD CODED UPDATE, TO TEST THE NOTIFIER..
        setInterval(function(){
            this.notifier.publish('blabla');
        }.bind(this),5000);
    }.bind(this)).catch(function (err) {
        this.markAsInitialized();
    }.bind(this));


}
util.inherits(kidModel, delayedCallbacks);


kidModel.prototype.update = function (information, callbackSuccessfulUpdated) {
    var callbackToAdd = function () {
        if (this.idTimerOnline != undefined)
            clearTimeout(this.idTimerOnline);
        this.idTimerOnline = idTimer;
        this.latitude = information['latitude'];
        this.longitude = intFilter['longitude'];
        this.syncedWithDB = true;
        //TODO take the targets from the db
        this.date = Date.now();

        var permittedLocation = this.isInPermittedLocation();
        this.notifier.publish({
            latitude: this.latitude,
            longitude: this.longitude,
            permitedLocation: permittedLocation
        });
        callbackSuccessfulUpdated(); //schimbat de la .call
    }.bind(this);
    this.callOrWaitInitialization(callbackToAdd);
};
kidModel.prototype.getNotifier = function () {
    return this.notifier;
}

kidModel.prototype.getTargets = function (callback) {

    var callbackToAdd = function () {
        callback(this.kidTargets);
    }.bind(this);
    this.callOrWaitInitialization(callbackToAdd);

}
kidModel.prototype.getKidInformation = function (timestampLastInfo, callback) {  //
    var callbackToAdd = function () {
        var kidInfo = {};
        var newTargets = this.kidTargets.filter(function (obj) {
            if (obj.date >= timestampLastInfo) {
                return true;
            }
            return false;
        });
        var anyThingNew = false;
        if (timestampLastInfo <= this.location.timestamp) {
            kidInfo['location'] = this.location.print();
            anyThingNew = true;
        }
        if (newTargets.length != 0) {

            kidInfo['targets'] = newTargets;
            anyThingNew=true;
        }
        kidInfo['kid'] = this.id;
        if(anyThingNew)
        callback(kidInfo);
        else callback(undefined);
    }.bind(this);
    this.callOrWaitInitialization(callbackToAdd);

}
kidModel.prototype.getID = function () {
    return this.id;
}


kidModel.prototype.getPosition = function (callbackGetPositions) {
    var callbackToAdd = function () {
        if (this.syncedWithDB == false) {
            //TODO have to get previous positions from the db if kid offline
            this.syncedWithDB = true;
        }
        if (this.date == undefined) {
            //kid never had a position
            var objectPosition = {
                'error': 'No info '
            };
            return objectPosition;
        }
        var objectPosition = {
            latitude: this.latitude,
            longitude: this.longitude,
            date: this.date
        };
    }.bind(this);
    this.addOrCallImidiately(callbackToAdd);
};


kidModel.prototype.isInPermittedLocation = function () {
    //TODO
}

kidModel.prototype.changeRestrictions = function () {
    //TODO
}


module.exports = kidModel;