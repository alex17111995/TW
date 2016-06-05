/**
 * Created by Ciubi on 28/03/16.
 */
var map = new Map();
var PubSub = require('./PubSub');
var childrenPubSub = require('./PubSubChildren');
var channels = require('./Channels');

var FactoryPubSub = function (type, id) {

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
                pubSubInstance = new childrenPubSub(id);
                break;
            }
            default:
                pubSubInstance = new PubSub();
        }
        mapOfType.set(id, pubSubInstance);
        return pubSubInstance;
    }
    return pubSubInstance;
};

module.exports = FactoryPubSub;