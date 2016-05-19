/**
 * Created by Alex on 5/18/2016.
 */
var promise = require('promise');
var oracleDB = require('oracledb');
var pool = undefined;

var getConnection = function () {
    return pool.getConnection();
}

var releaseConnection = function (connection) {
    connection.release(function (err) {
        if (err) {
            console.log(err);
        }
    });
};

module.exports = {

    initializeDB: function initializeDB(config) {

        return new promise(function (resolve, reject) {
            oracleDB.createPool(
                config,
                function (err, createdPool) {
                    if (err) {
                        return reject(err);
                    }

                    pool = createdPool;

                    resolve(pool);
                }
            );
        });

    },


    executeSQL: function (query, bind) {
        if(bind===undefined)
            bind=[];
        return new promise(function (resolve, reject) {
            pool.getConnection().then(function (connection) {
                connection.execute(query, bind, function (err, results) {
                    if (err) {
                        reject(err);
                        process.nextTick(function () {
                            releaseConnection(connection)
                        });
                    }
                    resolve(results);
                    process.nextTick(function () {
                        releaseConnection(connection)
                    });

                });
            });
        });

    }
};
