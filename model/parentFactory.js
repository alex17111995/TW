/**
 * Created by Alex on 4/29/2016.
 */

var child_handler= require('./child_handler');
var parentFactory= function(){
    this.map= new Map();
}

parentFactory.prototype.getInstance= function(id){
    var parentInstance=undefined;
    var map= this.map;
    parentInstance=map.get(id);
    if(parentInstance===undefined) {
        parentInstance = new child_handler(id);
        map.set(id, parentInstance);
    }
    return parentInstance;
}


var factory= new parentFactory();
var getFactoryInstance= function(){
    return factory;
}


module.exports=getFactoryInstance;
