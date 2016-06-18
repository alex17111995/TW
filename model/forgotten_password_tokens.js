/**
 * Created by Ciubi on 18/06/16.
 */
var token_maps = new Map();
var uuid = require('uuid');
const timeoutValue = 1000 * 60 * 15;
module.exports = {
    new_token: function (username) {
        var token = uuid.v4();
        token_maps.set(token, username);
        setTimeout(function () {
            token_maps.delete(token);
        }, timeoutValue);

        return token;
    },
    is_valid_token: function (token) {
        return token_maps.get(token) != undefined;
    },
    get_token_username: function (token) {
        return token_maps.get(token);
    },
    delete_token: function (token) {
        token_maps.delete(token);
    }

};