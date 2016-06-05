/**
 * Created by Ciubi on 04/06/16.
 */
var kidModel = require('./model/kidModel');
var childHandlerModel = require('./model/child_handler');
var channels = require('./Channels');
var PubSubFactory = require('./FactoryPubSub');
var promise = require('promise');
var validate_static_target_input = function (data) {
    return (Number.isInteger(data.kid) && Number.isInteger(data.radius) && (data.latitude >= -85.05115 && data.latitude <= 85)
    && (data.longitude >= -180 && data.longitude <= 180));
};

var subscribe_child = function (kid, handler) {
    var childChannel = PubSubFactory(channels.getChildChannelName(), kid);
    childChannel.subs(handler);

};
var unsubscribe_child = function (kid, handler) {
    var childChannel = PubSubFactory(channels.getChildChannelName(), kid);
    childChannel.unsubscribe(handler);
};

var subscribe_channels = function (socket, type_of_user, user_id) {
    return new promise(function (resolve, reject) {
        process.nextTick(function () {
            var on_publish_handler = function (msg) {
                socket.emit('blabla', msg);
            };
            var subscribed_children = [];
            var administrative_handler = function (msg) {
                if (msg.channel == 'new_child') { //
                    subscribed_children.push(msg.kid);
                    subscribe_child(msg.kid, on_publish_handler);
                    socket.emit('blabla', msg);
                    //TODO ia vechile evenimente


                }
                else if (msg.channel == 'deleted_child') {
                    subscribed_children = subscribed_children.filter(function (element) {
                        return element != msg.kid;
                    });
                    var childChannel = PubSubFactory(channels.getChildChannelName(), msg.kid);
                    childChannel.unsubscribe(on_publish_handler);
                    socket.emit('blabla', msg);
                }

            };

            var parent_administration = PubSubFactory(channels.getParentAdministrativeChannel(), user_id);
            parent_administration.subs(administrative_handler);
            var model = new childHandlerModel();
            model.get_tracked_children_ids(user_id).then(function (children_ids) {
                subscribed_children = children_ids;
                for (var i = 0; i < children_ids.length; ++i) {
                    var children_notifier = PubSubFactory(channels.getChildChannelName(), children_ids[i]);
                    children_notifier.subs(on_publish_handler);
                }
                resolve([on_publish_handler, administrative_handler, subscribed_children]);

            }).catch(function (error) {
                reject(error);
            });


        });
    });
};


var on_disconnect_unsubscribe_channels = function (handler, user_id) {
    var parent_administration = PubSubFactory(channels.getParentAdministrativeChannel(), user_id);
    parent_administration.unsubscribe(handler[1]);
    for (var i = 0; i < handler[2].lenght; i++) {
        unsubscribe_child(handler[2][i], handler[0]);
    }

};

var verify_session = function (socket) {
    return socket.request.session.id_user != undefined;
};


var socket_controller = function (socket) {
    // var session=socket.request.session; // Now it's available from Socket.IO sockets too! Win!
    var model = new childHandlerModel();
    if (!verify_session(socket)) {
        // socket.emit('error','invalid-session');
        socket.disconnect('invalid session');
        return;
    }

    subscribe_channels(socket, socket.request.session.type, socket.request.session.id_user).then(function (handlerID) {
            socket.on('disconnect', function () {
                on_disconnect_unsubscribe_channels(handlerID, socket.request.session.id_user);
            });
            socket.on('delete_static_target', function (data) {
                model.delete_static_target(socket.request.session.id_user, data.static_target_id).then(function (result) {


                    })
                    .catch(function (error) {
                        socket.emit('blabla', error.message);
                    });

            });


            socket.on('delete_parent', function (data) {

                model.delete_parent_of_child(socket.request.session.id_user, data.pid, data.kid).then(function (resp) {
                    console.log('merge' + resp);
                }).catch(function (resp) {

                });

            });
            socket.on('new_parent', function (data) {
                model.add_parent_to_child(socket.request.session.id_user, data.pid, data.kid).then(function (resp) {
                    console.log('merge' + resp);
                }).catch(function (resp) {

                });

            });


            socket.on('add_static_target', function (data) {
                if (!validate_static_target_input(data))
                    return;
                model.add_static_target(socket.request.session.id_user, data.kid, data.longitude, data.latitude, data.radius)
                    .then(function (result) {

                    })
                    .catch(function (error) {
                        socket.emit('error', error.message);
                    });

            });

            model.get_notifications(socket.request.session.id_user).then(function (initial_events) {
                socket.emit('initial_object', initial_events);

            }).catch(function (error) {
                socket.emit('error', error.message);
            });


        })
        .catch(function (error) {
            socket.disconnect('server error');
            console.log('error');
        });


};


module.exports = socket_controller;