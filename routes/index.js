var express = require('express');
var router = express.Router();
var pubSub = require('../PubSub')
var dbconnect = require('../model/dbconnect');
var promise = require('promise');
var kid_model = require('../model/kidModel');
var parent_model = require('../model/child_handler');
/* GET home page. */

var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.redirect('/login');
}
router.get('/stefan', verifySession, function (req, res, next) {


    //  if (req.session.type == "parent") {
    //    parent.getInformation(function(information) {
    //      res.render('index-stefan',{'information':information});
    // });

//    }
    //  else {
    var kid = parent_model(req.session.user_id);
    kid.getInformation(-1, function (kidInfo) {
        res.render('index-stefan', {'information': kidInfo});

    });
    //}

});

router.get('/', verifySession, function (req, res, next) {

    /*
     if (req.session.type == "parent") {
     var parent = parentFactory().getInstance(req.session.id_user);
     parent.getInformation(function (information) {
     res.send(information);
     });

     }
     */
    var model;
    if (req.session.type =='kid')
        model = new kid_model();
    else model = new parent_model();


    model.getInitialInformation(req.session.id_user, function (error,values) {
        res.send(values);
    }, function () {
        res.send("error");
    });



});


module.exports = router;
