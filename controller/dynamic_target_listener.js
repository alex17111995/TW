/**
 * Created by Alex on 5/4/2016.
 */

var PubSub=require('../FactoryPubSub');
var channels=require('../channels.js');

var dynamic_target_listener = function (childController,id, pid) {
    this.notifierParent = PubSub(channels.getParentLocationChannel(),pid);
    this.id = id;
    this.childController = childController;
    this.callbackLocation = function (parentNewLocationView) {
        this.childController.targetStateChanged();
    }.bind(this);
    this.notifierParent.subs(this.callbackLocation);
};


dynamic_target_listener.prototype.unsubscribe = function () {
    this.notifierParent.unsubscribe(this.callbackLocation);
}


module.exports=dynamic_target_listener;


//TODO alterRadius






