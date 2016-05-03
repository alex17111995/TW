var express = require('express');
var router = express.Router();
var pubSub = require('../PubSub')
var dbconnect = require('../model/dbconnect');
var promise = require('promise');
var parentFactory = require('../model/parentFactory');
/* GET home page. */

var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.redirect('/login');
}

router.get('/', verifySession, function (req, res, next) {

    if (req.session.isLogged != true) {
        res.redirect('/login');
    }
    else {
        if (req.session.type == "parent") {
            var parent = parentFactory().getInstance(req.session.id_user);
            parent.getChildren(function (children) {
                var promiseArray = [];
                for (var i = 0; i < children.length; i++) {
                    var promiseChild = new promise(function (resolve, reject) {
                        children[i].getKidInformation(-1,function (kidInfo) {
                            resolve(kidInfo);
                        });
                    });
                    promiseArray.push(promiseChild);
                }
                promise.all(promiseArray).then(function (arrayChildren) {
                    console.log(arrayChildren);
                    res.send(arrayChildren);
                }).catch(function (rekt) {
                    res.send(rekt);
                });
            });
        }
    }
});


module.exports = router;
