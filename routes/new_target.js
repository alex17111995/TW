/**
 * Created by Alex on 5/4/2016.
 */

var express = require('express');
var router = express.Router();
var kid_model = require('../model/kidModel');
var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.send({'error':'not logged'});
};

router.get('/', function (req, res, next) {


    //TODO NOW HARDCODED FOR TESTING
    var kid= new kid_model(12); //TODO REKT
    kid.add_static_target(12,12,100,function(message){
       res.send(message);
    });




});
module.exports=router;