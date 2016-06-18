/**
 * Created by Ciubi on 19/05/16.
 */

var autenticate = require('../oracleconnect');
var oracledb = require('oracledb');
var promise = require('promise');
var authenticateUser = function (typeOfUser, username, password) {
    return new promise(function (resolve, reject) {
        autenticate.executeSQL("BEGIN pack_auth.log_user(:type, :username,:password,:id); END;", {
            'type': typeOfUser,
            'username': username,
            'password': password,
            'id': {type: oracledb.NUMBER, dir: oracledb.BIND_OUT}

        }).then(function (result) {
            resolve(result.outBinds.id);
        }).catch(function (err) {
            reject(err);
        });
    });
};
var change_password_user = function (username,password) {

    return autenticate.executeSQL("BEGIN pack_auth.change_password(:username,:password); END;", {
        'username': username,
        'password': password
    });
};


module.exports ={
    authenticateUser:authenticateUser,
    change_password_user:change_password_user
};
