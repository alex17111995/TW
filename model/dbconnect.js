/**
 * Created by Ciubi on 28/03/16.
 */

var mysql = require('mysql');
var promise = require('promise');
var oracleDB = require('oracledb');
var pool = undefined;


var connection = new mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'salutyo1',
    database: 'tw'
});


connection.connect();
//connection.connect();

module.exports = connection;

var queries = {};

var queries22 = {
    validUser: function (username, password, type, callbackOK, callbackError) {
        var selectQuery = '';
        var idName = '';
        if (type == 'kid') {
            selectQuery = 'select kid from children';
            idName = 'kid';
        }
        else {
            selectQuery = 'select pid from parents';
            idName = 'pid';
        }
        connection.query(selectQuery + ' where username= \'' + username + '\' and passwordHash= \'' + password + '\'', function (err, rows, fields) {
            console.log(err);
            if (rows === undefined || rows.length === 0)
                callbackError.apply(this);
            else callbackOK.apply(this, [rows[0][idName]]);
        });
    },
    trackedKidsEvents: function (pid, timestampLastUpdated, callbackOK, callbackError) {
        connection.beginTransaction(function (err) {
            queries.kidsOfHandler(pid, function (kIDs) {


            }, function (error) {
                connection.rollback();
                callbackError(error);
            })

        });
    },


    registerParent: function (username, password, callbackOK, callbackError) {
        this.validUser(username, password, function (id) {
            callbackError.apply(this);
        }, function () {
            connection.query('insert into parents(username,passwordHash) values (\'' + username + "\',\'" + password + '\')', function (err, rows, fields) {
                if (err) {
                    console.log(err);
                    callbackError.apply(this, 0);
                    return;
                }
                callbackOK.apply(this);

            });
        });
    }
    ,
    add_static_target: function (kid, latitude, longitude, radius, creation_date, callbackOK, callbackError) {
        connection.query('insert into static_target(kid,latitude,longitude,radius,creation_date) values(?,?,?,?,?)', [kid, latitude, longitude, radius, creation_date], function (err, rows) {
            if (err)
                callbackError(err);
            else {
                connection.query('SELECT LAST_INSERT_ID()', function (err, rows) {
                    callbackOK(rows[0]['LAST_INSERT_ID()']);
                });
            }
        });

    }
}
