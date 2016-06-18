/**
 * Created by Ciubi on 17/06/16.
 */
var autenticate = require('../oracleconnect');
var oracledb = require('oracledb');
var promise = require('promise');
var authenticateUser = function (fb_id,email,first_name,last_name) {

    return new promise(function (resolve, reject) {
        autenticate.executeSQL("BEGIN pack_auth.add_or_log_fb(:fb_id,:email, :first_name,:last_name,:id); END;", {
            fb_id:fb_id,
            'email': email,
            'first_name': first_name,
            'last_name':last_name,
            'id': {type: oracledb.NUMBER, dir: oracledb.BIND_OUT}

        }).then(function (result) {
            resolve(result.outBinds.id);
        }).catch(function (err) {
            reject(err);
        });
    });
};
module.exports=authenticateUser;