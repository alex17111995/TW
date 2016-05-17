/**
 * Created by Ciubi on 28/03/16.
 */
var express = require('express');
var kid_model = require('../model/kidModel');
var parent_model = require('../model/child_handler');
var router = express.Router();
/* GET users listing. */
var verifyAlreadyLogged = function (req, res, next) {
    if (req.session.isLogged == true) {
        res.redirect('/');
        return;
    }
    next();
}

router.get('/', verifyAlreadyLogged, function (req, res, next) {
    res.render('login', {title: 'Login'});
});

router.post('/', verifyAlreadyLogged, function (req, res, next) {
    //TODO checkDB


    if (req.body.isChild == 'on') {
        kid = new kid_model();

        kid.validUser(req.body.username, req.body.password, function (id) {
                req.session.username = req.body.username;
                req.session.id_user = id;
                req.session.type = "kid";
                req.session.isLogged = true;
                res.redirect('/');
            }, function () {
                res.send('KO')
            }
        );
        return;
    }

    parent = new parent_model();
    parent.validUser(req.body.username, req.body.password, function (id) {
        req.session.username = req.body.username;
        req.session.id_user = id;
        req.session.type = "parent";
        req.session.isLogged = true;
        res.redirect('/');
    }, function () {
        res.send('KO');
    });
    //db.blablabla();

});


router.get('/register', verifyAlreadyLogged, function (req, res, next) {
    res.render('login', {title: 'Register'});
});
router.post('/register', verifyAlreadyLogged, function (req, res, next) {
    db.registerUser(req.body.username, req.body.password, function (id) {
        req.session.isLogged = true;
        res.send('OK');
    }, function () {
        res.send('KO');
    });
});


module.exports = router;