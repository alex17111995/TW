/**
 * Created by Ciubi on 28/03/16.
 */
var map= new Map();
var PubSub=require('./PubSub');

var FactoryPubSub= function(type,id){
   mapOfType= map.get(type);
    if(mapOfType===undefined){
        mapOfType= new Map();
        map.set(type,mapOfType);
        pubSub=new PubSub();
        mapOfType.set(id,pubSub);
        return pubSub;
    }
    pubSubInstance=mapOfType.get(id);
    if(pubSubInstance===undefined){
        pubSubInstance=new PubSub();
        mapOfType.set(id,pubSubInstance);
        return pubSubInstance;
    }
    return pubSubInstance;
}

module.exports=FactoryPubSub;