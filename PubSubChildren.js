/**
 * Created by Ciubi on 04/06/16.
 */

var poller = require('./controller/poller_listener');


var PubSubChildren = function (kid) {
    this.handlers = [];
    this.poller = new poller(this,kid);


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
    }
};

PubSubChildren.prototype.close = function () {
    this.poller.close();
    this.poller = undefined;
    this.handlers = [];
};


module.exports = PubSubChildren;
