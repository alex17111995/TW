/**
 * Created by Ciubi on 28/03/16.
 */
var express = require('express');
var authenticate = require('../model/authenticate');
var register = require('../model/registerParent');
var router = express.Router();
/* GET users listing. */
var verifyAlreadyLogged = function (req, res, next) {
    if (req.session.isLogged == true) {
        res.redirect('/');
        return;
    }
    next();
};

router.get('/', verifyAlreadyLogged, function (req, res, next) {
    res.render('login', {title: 'Login'});
});

router.post('/', verifyAlreadyLogged, function (req, res, next) {
    //TODO checkDB

    var type = 'parent';
    if (req.body.isChild == 'on') {
        type = 'kid';
    }
    authenticate.authenticateUser(type, req.body.username, req.body.password).then(function (id) {
        req.session.id_user = id;
        req.session.type = type;
        req.session.isLogged = true;
        res.redirect('/');
    }).catch(function (error) {
        res.send(error.message);
    });

    /*
     parent.validUser(req.body.username, req.body.password, function (id) {
     req.session.username = req.body.username;
     req.session.id_user = id;
     req.session.type = "parent";
     req.session.isLogged = true;
     res.redirect('/');
     }, function () {
     res.s
     end('KO');
     });
     */
    //db.blablabla();

});


router.get('/register', verifyAlreadyLogged, function (req, res, next) {
    res.render('register', {title: 'Register'});
});
router.post('/register', verifyAlreadyLogged, function (req, res, next) {
    register(req.body.username, req.body.password, req.body.email, req.body.first_name, req.body.last_name)
        .then(function () {
            res.send('OK');
        }).catch(function (err) {
        res.send(err.message);
    });
});


module.exports = router;