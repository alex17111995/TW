/**
 * Created by Alex on 5/2/2016.
 */
var express = require('express');
var router = express.Router();
var parentFactory = require('../model/parentFactory');
var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.send({'error':'not logged'});
}

router.get('/', verifySession, function (req, res, next) {
    var timestamp=req.query.timestamp;
    if (req.session.type == "parent") {
        var parent = parentFactory().getInstance(req.session.id_user);
        parent.getNotifications(timestamp,function(kidEvents){
           res.send(kidEvents);
        });

    }




});
module.exports = router;