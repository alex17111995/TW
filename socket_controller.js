/**
 * Created by Ciubi on 03/06/16.
 */
var kidModel = require('./model/kidModel');
var parentModel = require('./model/child_handler');
var channels = require('./Channels');
var PubSubFactory = require('./FactoryPubSub');


var validate_static_target_input = function (data) {
    return (Number.isInteger(data.kid) && Number.isInteger(data.radius) && (data.latitude >= -85.05115 && data.latitude <= 85)
    && (data.longitude >= -180 && data.longitude <= 180));
};


var subscribe_channels = function (socket, type_of_user, user_id) {
    var on_publish_handler = function (msg) {
        socket.emit(msg.channel, msg.data);
    };
    if (type_of_user == "kid") {
        var childChannel = PubSubFactory(channels.getChildChannelName(), user_id);
        childChannel.subs(on_publish_handler);
    }
    return on_publish_handler;
};

var on_disconnect_unsubscribe_channels = function (handler, type_of_user, user_id) {
    if (type_of_user == "kid") {
        var childChannel = PubSubFactory(channels.getChildChannelName(), user_id);
        childChannel.unsubscribe(handler);
    }

};

var verify_session = function (socket) {
    return socket.request.session.id_user != undefined;
};

var socket_controller = function (socket) {
    // var session=socket.request.session; // Now it's available from Socket.IO sockets too! Win!
    var model = undefined;
    if (!verify_session(socket)) {
        // socket.emit('error','invalid-session');
        socket.disconnect('invalid session');
        return;
    }
    if (socket.request.session.type == "kid") {
        model = new kidModel();
    }
    else model = new parentModel();
    var publish_handler_id = subscribe_channels(socket, socket.request.session.type, socket.request.session.id_user);
    socket.on('disconnect', function () {
        on_disconnect_unsubscribe_channels(publish_handler_id, socket.request.session.type, socket.request.session.id_user);
    });
    socket.on('delete_static_target',function(data){
        model.delete_static_target(socket.request.session.id_user,data.static_target_id).then(function (result){


            })
            .catch(function(error){
                socket.emit('error', error.message);
            });

    });

    socket.on('add_static_target', function (data) {
        if (!validate_static_target_input(data))
            return;
        model.add_static_target(socket.request.session.id_user,data.kid,data.longitude,data.latitude,data.radius)
        .then(function (result){

        })
        .catch(function(error){
            socket.emit('error', error.message);
        });

    });

    model.get_notifications(socket.request.session.id_user).then(function (initial_events) {
        socket.emit('initial_object', initial_events);

    }).catch(function (error) {
        socket.emit('error', error.message);
    });


};

module.exports = socket_controller;