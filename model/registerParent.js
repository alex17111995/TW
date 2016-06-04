/**
 * Created by Ciubi on 20/05/16.
 */
var promise=require('promise');
var oracleConn=require('../oracleconnect');
var registerParent = function (username, password) {
    return new promise(function (resolve, reject) {
        oracleConn.executeSQL("BEGIN pack_auth.add_user('parent', :username,:password); END;", {
            'username': username,
            'password': password

        }).then(function (result) {
            resolve();
        }).catch(function (err) {
            reject(err);
        });
    });
};

module.exports=registerParent;
