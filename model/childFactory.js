/**
 * Created by Alex on 5/1/2016.
 */

var child= require('./kid');
var childFactory= function(){
    this.map= new Map();
}

childFactory.prototype.getInstance= function(id){
    var childInstance=undefined;
    var map= this.map;
    childInstance=map.get(id);
    if(childInstance===undefined) {
        childInstance = new child(id);
        map.set(id, childInstance);
    }
    return childInstance;
}


var factory= new childFactory();
var getFactoryInstance= function(){
    return factory;
}
module.exports=getFactoryInstance;