var express = require('express');
var router = express.Router();
var promise = require('promise');
var parent_model = require('../model/child_handler');
var jsonFormats = require('../jsonFormats');
/* GET home page. */
var oracledb = require('oracledb');
var path= require('path');
var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.redirect('/login');
};
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
   /* var model
    if(req.session.type=="parent")
    model=  new parent_model();
    else model= new kid_model();
    model.get_notifications(req.session.id_user, {static_targets_id: -1}).then(function (values) {
        res.send(values);
    }).catch(function (error) {
        res.send(error.message);
    });
    */
    res.sendFile(path.join(__dirname,'../public', 'index-1-16.html'));
   // res.render('index');

});
/*
 if (req.session.type == "parent") {
 var parent = parentFactory().getInstance(req.session.id_user);
 parent.getInformation(function (information) {
 res.send(information);
 });

 }


 */
//  var model;
// if (req.session.type =='kid')
//   model = new kid_model();
// else model = new parent_model();


//  model.getInitialInformation(req.session.id_user, function (error,values) {
//    res.send(values);
// }, function () {
//   res.send("error");
//});


//}


module.exports = router;
