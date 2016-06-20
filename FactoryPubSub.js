/**
 * Created by Ciubi on 28/03/16.
 */
var map = new Map();
var PubSub = require('./PubSub');
var childrenPubSub = require('./PubSubChildren');
var channels = require('./Channels');

var create = function (type, id) {

    var mapOfType = map.get(type);
    if (mapOfType === undefined) {
        mapOfType = new Map();
        map.set(type, mapOfType);
    }

    var pubSubInstance = mapOfType.get(id);
    if (pubSubInstance === undefined) {
        switch (type) {
            case channels.getChildChannelName():
            {
                pubSubInstance = new childrenPubSub(type,id);
                break;
            }
            default:
                pubSubInstance = new PubSub(type,id);
        }
        mapOfType.set(id, pubSubInstance);
        return pubSubInstance;
    }
    return pubSubInstance;
};
var publish_if_existing = function (type, id, message) {
    var mapOfType = map.get(type);
    if (mapOfType == undefined)
        return;
    var pubSub = mapOfType.get(id);
    if (pubSub) pubSub.publish(message);
};

var destroy = function (type, id) {
    console.log('distrug ' + type + ' '+id);
    var mapOfType = map.get(type);
    if (mapOfType != undefined) {
        var instance = mapOfType.get(id);
        mapOfType.delete(id);
        if (instance != undefined)
            instance.close();
    }

};


module.exports = {
    create: create,
    publish_if_existing: publish_if_existing,
    destroy: destroy
};