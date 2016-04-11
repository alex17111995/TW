/**
 * Created by Ciubi on 27/03/16.
 */
var PubSub = function () {

    this.handlers = [];
};

PubSub.prototype.subs= function( handler) {
       // if (typeof context === 'undefined') { context = handler; }
        this.handlers.push(handler);
    };

PubSub.prototype.publish= function(message) {
        for (var i = 0; i < this.handlers.length; i++) {
                this.handlers[i].call(this,message);
            }
        };
PubSub.prototype.unsubscribe= function(handler){
    for(i=0;i<this.handlers.length;i++){
        if(handler==this.handlers[i])
            this.handlers.splice(i,1);
    }
}
var instance;
module.exports=PubSub;


function createInstance() {
    var object = new PubSub();
    return object;
}

module.exports= {
    getInstance: function () {
        if (!instance) {
            instance = createInstance();
        }
        return instance;
    }
};