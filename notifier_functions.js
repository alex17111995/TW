/**
 * Created by Ciubi on 06/06/16.
 */
//var factoryPubSub=
var PubSubFactory = require('./FactoryPubSub');
var channels = require('./Channels');

module.exports =
{
    emit_geo_alert: function (kid, alertType) {
        if (typeof kid == 'number') {
            PubSubFactory.publish_if_existing(channels.getChildChannelName(), kid
                , {
                    'channel': 'alert_geofencing',
                    data: {
                        'alert_type': alertType,
                        'kid': kid
                    }
                });
        }
    }
};
