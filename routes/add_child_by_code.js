/**
 * Created by Ciubi on 19/06/16.
 */
/**
 * Created by Ciubi on 19/06/16.
 */
var express = require('express');
var router = express.Router();
var authenticate = require('../model/authenticate');
var tokens = require('../model/forgotten_password_tokens').kid_code;
var childHandlerModel = require('../model/child_handler');
var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.redirect('/login');
};

router.get('/', verifySession, function (req, res) {
    res.render('reset-password');
});
router.post('/', verifySession, function (req, res) {
    if (req.session.type != 'parent') {
        res.sendStatus(403);
        return;
    }
    //TODO change view
    var userID = tokens.get_token_username(req.body.password);
    if (userID === undefined) {
        res.status(404);
        res.send('Invalid token');
        return;
    }
    var model = new childHandlerModel();
    model.add_parent_to_child(req.session.id_user, userID)
        .then(function (result) {
            res.send({message: 'Added,kid will be added in menu'});
        })
        .catch(function (error) {
            res.status(403);
            res.send({error: error});
        });


});


module.exports = router;