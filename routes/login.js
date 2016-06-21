/**
 * Created by Ciubi on 28/03/16.
 */
var express = require('express');
var authenticate = require('../model/authenticate');
var register = require('../model/registerParent');
var router = express.Router();
var path = require('path');
var mail_sender = require('../mail_connection');
var forgotten_password_tokens = require('../model/forgotten_password_tokens').reset_password;
var parent_model = require('../model/child_handler');
/* GET users listing. */
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var fb_model = require('../model/authenticate_fb');
passport.use(new Strategy({
        clientID: 283542462000311,
        clientSecret: 'eed771c7c9dcaa62235b0f6acfad8d8b',
        callbackURL: 'localhost:3000/login/facebook/return',
        profileFields: ['id', 'name', 'emails'],
        enableProof: true
    },
    function (accessToken, refreshToken, profile, cb) {
        return cb(null, profile);
    }));
passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});


router.get('/facebook/return',
    passport.authenticate('facebook', {session: false, failureRedirect: '/login'}),
    function (req, res) {

        fb_model(req.user.id,req.user.emails[0].value, req.user.name.givenName, req.user.name.familyName).then(function (id_user) {
                req.session.id_user = id_user;
                req.session.type = 'parent';
                req.session.isLogged = true;
                res.redirect('/');
            })
            .catch(function (error) {
                res.redirect('/login');
            });

    });





var verifyAlreadyLogged = function (req, res, next) {
    if (req.session.isLogged == true) {
        res.redirect('/');
        return;
    }
    next();
};

router.get('/', verifyAlreadyLogged, function (req, res, next) {
    //res.render('login', {title: 'Login'});
    res.sendFile(path.join(__dirname, '../public', 'login-6.html'));
});

router.post('/', verifyAlreadyLogged, function (req, res, next) {

    if (req.body.message_type == 'parent_login') {
        req.body.type = 'parent';
        req.body.username = req.body.parentUsername;
        req.body.password = req.body.parentPassword;
        return login_user(req, res, next);
    }
    if (req.body.message_type == 'child_login') {
        req.body.type = 'kid';
        req.body.username = req.body.kidUsername;
        req.body.password = req.body.kidPassword;
        return login_user(req, res, next);
    }
    if (req.body.message_type == 'parent_registration') {
        return register_parent(req, res, next);
    }
    if (req.body.message_type == 'password_reset') {
        return forgot_password(req, res, next);

    }
    if(req.body.message_type=='facebook_login'){
      var route=  passport.authenticate('facebook', {scope: ['email']});
        route(req,res,next);
    }


});

var login_user = function (req, res, next) {

    authenticate.authenticateUser(req.body.type, req.body.username, req.body.password).then(function (id) {
        req.session.id_user = id;
        req.session.type = req.body.type;
        req.session.isLogged = true;
        res.redirect('/');
    }).catch(function (error) {
        res.send(error.message);
    });
};

var routeResetPassword = function (token) {
    return "http://192.168.1.3:3000/reset-password?token=" + token;
};
var mailStructure = function (token) {
    return "Click " + routeResetPassword(token) + ' to reset your password';

};

var forgot_password = function (req, res, next) {
    var username = req.body.parentUsername;
    var model = new parent_model();
    model.get_email_of_username(username).then(function (email) {
            var token = forgotten_password_tokens.new_token(username);
            mail_sender.sendMail(email, 'Password reset', mailStructure(token)).then(function (sent_mail) {
                    res.send("Mail sent to " + email);
                })
                .catch(function (error) {
                    res.send(error);
                })
        })
        .catch(function (error) {
            res.send(error);
        });
}

var register_parent = function (req, res, next) {
    register(req.body.username, req.body.password, req.body.email, req.body.firstname, req.body.lastname)
        .then(function () {
            res.send('OK');
        }).catch(function (err) {
        res.send(err.message);
    });
};


module.exports = router;