/**
 * Created by Ciubi on 19/06/16.
 */
var tokens = require('../model/forgotten_password_tokens');
var express = require('express');
var router = express.Router();
var authenticate = require('../model/authenticate');

var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.redirect('/login');
};

router.get('/', verifySession, function (req, res) {
    res.render('generate_kid_code');
});

module.exports=router;