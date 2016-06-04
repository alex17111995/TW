/**
 * Created by Alex on 5/18/2016.
 */
var promise = require('promise');
var oracleDB = require('oracledb');
var pool = undefined;
var getConnection = function () {
    return pool.getConnection();
};

function objectify(keys, array) {
    var objectArray = [];
    for (var i = 0; i < array.length; i++) {
        var object = {};
        for (var j = 0; j < keys.length; j++)
            object[keys[j].name] = array[i][j];
        objectArray.push(object);
    }
    return objectArray;

}
var commit_and_close = function (connection) {
    return new promise(function (resolve, reject) {
        connection.commit().then(function () {
            releaseConnection(connection);
            resolve(true);

        }).catch(function (error) {
            reject(error.message);
            console.log(error.message);
            releaseConnection(connection);
        })
    });
};

var rollback_and_close = function (connection) {
    return new promise(function (resolve, reject) {
        connection.rollback.then(function () {
            releaseConnection(connection);
            resolve(true);

        }).catch(function (error) {
            console.log(error.message);
            reject(error.message);
            releaseConnection(connection);
        });
    });
};


var releaseConnection = function (connection) {
    process.nextTick(function () {
        connection.release(function (err) {
            if (err) {
                console.log(err);
            }
        });
    });
};
var closeCursor = function (cursor, connection) {
    return new promise(function (resolve, reject) {
        cursor.close(function (err) {
            if (err) {
                console.log(err.message);
                reject(err);
                return;
            }
            resolve();
        });
    });


};


var getCursorResults = function (cursor, connection) {

    return new promise(function (resolve, reject) {
        var results = [];
        cursor.getRows(10, function (err, rows) {
            if (err) {
                console.log(err.message);
                reject(err);
                closeCursor(cursor, connection);
                return;
            }
            if (rows.length == 0) {
                results = objectify(cursor.metaData, rows);
                closeCursor(cursor, connection).then(function () {
                    resolve(results);
                }).catch(function (err) {
                    reject(err);
                });

            } else {
                results = objectify(cursor.metaData, rows);
                getCursorResults(cursor, connection).then(function (newResults) {
                    results = results.concat(newResults);

                    resolve(results);
                }).catch(function (error) {
                    reject(error);
                });

            }


        })
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
    getCursorResults: getCursorResults,
    commit_and_close:commit_and_close,
    rollback_and_close:rollback_and_close,
    execute_SQL_leave_connection: function (query, bind) {
        if (bind === undefined)
            bind = [];
        return new promise(function (resolve, reject) {
            pool.getConnection().then(function (connection) {
                connection.execute("ALTER SESSION SET ISOLATION_LEVEL=SERIALIZABLE", function (err, results) {
                    connection.execute(query, bind, {autoCommit: false}, function (err, results) {
                        if (err) {
                            reject(err);
                            process.nextTick(function () {
                                releaseConnection(connection)
                            });
                            return;
                        }
                        resolve({connection: connection, results: results});
                    });
                });
            });

        });
    },
    releaseConnection: function (connection) {
        process.nextTick(function () {
            releaseConnection(connection)
        });
    },
    getConnection: getConnection,

    executeSQL: function (query, bind) {
        if (bind === undefined)
            bind = [];
        return new promise(function (resolve, reject) {
            pool.getConnection().then(function (connection) {
                connection.execute(query, bind, {autoCommit: true}, function (err, results) {
                    if (err) {
                        reject(err);
                        process.nextTick(function () {
                            releaseConnection(connection)
                        });
                        return;
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
