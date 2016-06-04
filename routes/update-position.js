/**
 * Created by Alex on 5/3/2016.
 */


var express = require('express');
var db = require('../model/dbconnect');
var parent_model = require('../model/child_handler');
var child_model = require('../model/kidModel');
var router = express.Router();
/* GET users listing. */
var verifyAlreadyLogged = function (req, res, next) {
    next();
}

router.get('/', verifyAlreadyLogged, function (req, res, next) {
    res.render('login', {title: 'update-position'});
});

router.post('/', verifyAlreadyLogged, function (req, res, next){

    //TODO used the same layout as for login whole function has to be rewritten

    var latitude= parseFloat(req.body.username);
    var longitude= parseFloat(req.body.password);
    var object=undefined;
    if(req.session.type=="kid")
        object= new child_model();
    else
        object=new parent_model();

    object.updateLocation(req.session.id_user,{'latitude':latitude,'longitude':longitude}).then(function(resp){
        res.send(resp);
    })
    .catch(function(err){
        res.send(err.message);
    })


});

module.exports = router;
