/**
 * Created by Ciubi on 27/03/16.
 */
var PubSub = function (type,id) {
    this.type=type;
    this.id=id;
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
    for(var i=0;i<this.handlers.length;i++){
        if(handler==this.handlers[i])
            this.handlers.splice(i,1);
        if(this.handlers.length===0){
            var factory=require('./FactoryPubSub');
            factory.destroy(this.type,this.id);
        }
    }
};
PubSub.prototype.close = function () {
    console.log('sunt parinte si ma inchid');
    this.handlers=[];
};


module.exports=PubSub;
