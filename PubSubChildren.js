/**
 * Created by Ciubi on 04/06/16.
 */

var promise = require('promise');

var PubSubChildren = function (type,kid) {
    this.type = type;
    this.kid = kid;
    this.handlers = [];
   // this.poller = poller(this, kid);
};

PubSubChildren.prototype.subs = function (handler) {
    // if (typeof context === 'undefined') { context = handler; }
    this.handlers.push(handler);
};

PubSubChildren.prototype.publish = function (message) {
    for (var i = 0; i < this.handlers.length; i++) {
        this.handlers[i].call(this, message);
    }

};
PubSubChildren.prototype.unsubscribe = function (handler) {
    for (var i = 0; i < this.handlers.length; i++) {
        if (handler == this.handlers[i])
            this.handlers.splice(i, 1);
        if(this.handlers.length===0){
            var factory=require('./FactoryPubSub');
            factory.destroy(this.type,this.kid);
        }
    }
};

PubSubChildren.prototype.close = function () {
//    this.poller.stop();
   console.log('sunt copil si ma inchid');
  //  this.poller = undefined;
    this.handlers = [];
};


module.exports = PubSubChildren;
