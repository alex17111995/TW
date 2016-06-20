/**
 * Created by Ciubi on 20/05/16.
 */
var promise = require('promise');
var oracleConn = require('../oracleconnect');
var validations = require('./validations');
var registerParent = function (username, password, email,first_name,last_name) {
    return new promise(function (resolve, reject) {
        if (!validations.validate_email(email)) {
            reject(new Error('invalid email'));
            return;
        }
        oracleConn.executeSQL("BEGIN pack_auth.add_user( :username,:password,:email,:first_name,:last_name); END;", {
            'username': username,
            'password': password,
            'email': email,
            first_name:first_name,
            last_name:last_name

        }).then(function () {
            resolve();
        }).catch(function (err) {
            reject(err);
        });
    });
};

module.exports = registerParent;
