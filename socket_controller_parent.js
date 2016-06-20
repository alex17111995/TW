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
    var childChannel = PubSubFactory.create(channels.getChildChannelName(), kid);
    childChannel.subs(handler);

};
var unsubscribe_child = function (kid, handler) {
    var childChannel = PubSubFactory.create(channels.getChildChannelName(), kid);
    childChannel.unsubscribe(handler);
};

var subscribe_channels = function (socket, type_of_user, user_id) {
    return new promise(function (resolve, reject) {
        process.nextTick(function () {
            var on_publish_handler = function (msg) {
                socket.emit(msg.channel, msg.data);
            };
            var subscribed_children = [];
            var administrative_handler = function (msg) {
                if (msg.channel == 'new_child') { //
                    subscribed_children.push(msg.kid);
                    subscribe_child(msg.kid, on_publish_handler);
                    var kid = new kidModel();
                    kid.get_notifications(msg.kid).then(function (child_structure) {

                            socket.emit('new_child', child_structure);
                        })
                        .catch(function (error) {
                            socket.emit('err', 'Server error occurded, reload page');
                        });

                    //TODO ia vechile evenimente


                }
                else if (msg.channel == 'deleted_child') {
                    subscribed_children = subscribed_children.filter(function (element) {
                        return element != msg.data.kid;
                    });
                    var childChannel = PubSubFactory.create(channels.getChildChannelName(), msg.data.kid);
                    childChannel.unsubscribe(on_publish_handler);
                    socket.emit('deleted_child', msg.data);
                }

            };

            var parent_administration = PubSubFactory.create(channels.getParentAdministrativeChannel(), user_id);
            parent_administration.subs(administrative_handler);
            var model = new childHandlerModel();
            model.get_tracked_children_ids(user_id).then(function (children_ids) {
                subscribed_children = children_ids;
                for (var i = 0; i < children_ids.length; ++i) {
                    var children_notifier = PubSubFactory.create(channels.getChildChannelName(), children_ids[i]);
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
    var parent_administration = PubSubFactory.create(channels.getParentAdministrativeChannel(), user_id);
    parent_administration.unsubscribe(handler[1]);
    for (var i = 0; i < handler[2].length; i++) {
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
                model.delete_static_target(socket.request.session.id_user, data).then(function (result) {


                    })
                    .catch(function (error) {
                        socket.emit('blabla', error.message);
                        console.log(error.message);
                    });

            });

            socket.on('delete_dynamic_target', function (data) {
                model.no_longer_dynamic_target(socket.request.session.id_user, data)
                    .then(function () {

                    })
                    .catch(function () {

                    });
            });

            socket.on('delete_parent', function (data) {

                model.delete_parent_of_child(socket.request.session.id_user, data.pid, data.kid).then(function (resp) {
                    console.log('merge' + resp);
                }).catch(function (resp) {
                    console.log(resp);
                });

            });
            socket.on('make_dynamic', function (data) {
                model.make_parent_dynamic_target(socket.request.session.id_user, data.kid, data.radius);
            });
            //  socket.on('add_parent', function (data) {
            //    model.add_parent_to_child(socket.request.session.id_user, data.pid, data.kid).then(function (resp) {
            //      console.log('merge' + resp);
            // }).catch(function (resp) {

            // });

            // });
            socket.on('register_kid', function (data) {
                model.register_kid(socket.request.session.id_user, {
                    username: data.username,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name
                })

            });

            socket.on('add_static_target', function (data) {
                //  data.radius = Math.floor(data.radius);
                //  var validated = validate_static_target_input(data);
                // console.log(validated);

//                if (!validated)
                //                  socket.emit('err', 'invalid_data');
                model.add_static_target(socket.request.session.id_user, data.kid, data.longitude, data.latitude, data.radius)
                    .then(function (result) {

                    })
                    .catch(function (error) {
                        socket.emit('error', error.message);
                    });

            });

            model.get_notifications(socket.request.session.id_user).then(function (initial_events) {
                setTimeout(function () {
                    socket.emit('initial_object', initial_events);
                }, 1);
                console.log('merge');

            }).catch(function (error) {
                socket.emit('error', error.message);
                console.log(error.message);
            });


        })
        .catch(function (error) {
            socket.disconnect('server error');
            console.log('error');
        });


};


module.exports = socket_controller;