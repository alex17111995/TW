/**
 * Created by Alex on 4/29/2016.
 */

var child_handler= require('./child_handler');


var parentFactory= function(){
    this.map= new Map();
}

parentFactory.prototype.getInstance= function(id){

    var parentInstance=this.map.get(id);
    if(parentInstance===undefined){
        parentInstance= new child_handler(id);
        this.map.set(id,parentInstance);
    }
    return parentInstance;
}
module.exports= parentFactory();