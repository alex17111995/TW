/**
 * Created by Ciubi on 16/06/16.
 */

var express = require('express');
var router = express.Router();
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var fb_model = require('../model/authenticate_fb');
passport.use(new Strategy({
        clientID: 283542462000311,
        clientSecret: 'eed771c7c9dcaa62235b0f6acfad8d8b',
        callbackURL: 'http://localhost:3000/facebook/return',
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
router.get('/',function(req,res) {
    passport.authenticate('facebook', {scope: ['email']});
});
router.get('/return',
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


module.exports = router;

