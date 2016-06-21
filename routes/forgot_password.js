/**
 * Created by Ciubi on 18/06/16.
 */
var express = require('express');
var router = express.Router();
var promise = require('promise');
var mail_sender = require('../mail_connection');
var forgotten_password_tokens = require('../model/forgotten_password_tokens').reset_password;
var parent_model = require('../model/child_handler');
router.get('/', function (req, res, next) {
    //var username=req.body.username;
    res.render('forgot_password');
});
var routeResetPassword = function (token) {
    return "http://localhost:3000/reset-password?token=" + token;
};
var mailStructure = function (token) {
    return "Click " + routeResetPassword(token) + ' to reset your password';

};

router.post('/', function (req, res, next) {
    var username = req.body.username;
    var model = new parent_model();
    model.get_email_of_username(username).then(function (email) {
            var token = forgotten_password_tokens.new_token(username);
            mail_sender.sendMail(email, 'Password reset', mailStructure(token)).then(function (sent_mail) {
                    res.send("Mail sent to " + email);
                })
                .catch(function (error) {
                    res.send(error.message);
                })
        })
        .catch(function (error) {
            res.send(error.message);
        });
});


module.exports = router;