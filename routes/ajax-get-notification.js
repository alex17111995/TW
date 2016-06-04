/**
 * Created by Alex on 5/2/2016.
 */
var express = require('express');
var router = express.Router();
var parent_model = require('../model/child_handler');
var kid_model= require('../model/kidModel');
var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.send({'error':'not logged'});
};

router.get('/', verifySession, function (req, res, next) {
    var parent =  new parent_model();
    parent.get_new_notifications(req.session.id_user, {static_targets_id:1000}).then(function (values) {
        res.send(values);
        var should_not_subscribe=false;
        for(var i=0;i<values.length;i++){
            should_not_subscribe&=values[i].recieved_new_event(); //if one of the object has a new event
        }
        if(should_not_subscribe){
            res.send(values);
        }


    }).catch(function (error) {
        res.send(error.message);
    });

});
module.exports = router;