/**
 * Created by Ciubi on 04/06/16.
 */
var socket_controller_child = require('./socket_controller');
var socket_controller_parent = require('./socket_controller_parent');
var socket_controller = function (socket) {
    if (socket.request.session.type == 'kid') {
        socket_controller_child(socket);
    }
    else if (socket.request.session.type == 'parent') {
        socket_controller_parent(socket);
    }

};

module.exports = socket_controller;