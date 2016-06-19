/**
 * Created by Ciubi on 18/06/16.
 */

var uuid = require('uuid');
const timeoutValue = 1000 * 60 * 15;
var tokenInstance = function () {
    this.token_maps = new Map();
};


tokenInstance.prototype = {
    new_token: function (username) {
        var token = uuid.v4();
        this.token_maps.set(token, username);
        setTimeout(function () {
            this.token_maps.delete(token);
        }.bind(this), timeoutValue);

        return token;
    },
    is_valid_token: function (token) {
        return this.token_maps.get(token) != undefined;
    },
    get_token_username: function (token) {
        return this.token_maps.get(token);
    },
    delete_token: function (token) {
        this.token_maps.delete(token);
    }

};
var reset_password = new tokenInstance();
var kid_code = new tokenInstance();

module.exports =
{
    reset_password: reset_password,
    kid_code: kid_code

};