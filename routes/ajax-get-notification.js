/**
 * Created by Alex on 5/2/2016.
 */
var express = require('express');
var router = express.Router();
var parent_model = require('../model/kidModel');
var kid_model= require('../model/child_handler');
var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.send({'error':'not logged'});
}

router.get('/', verifySession, function (req, res, next) {
    var timestamp=req.query.timestamp;
    var model;
    if (req.session.type == "parent") {
        model = new parent_model(req.sesion.id_user);
    }
    else model= new kid_model(req.session.id_user);


        model.getNotifications(timestamp,function(kidEvents){
           res.send(kidEvents);
        });




});
module.exports = router;