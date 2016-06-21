/**
 * Created by Ciubi on 19/06/16.
 */
var tokens = require('../model/forgotten_password_tokens').kid_code;
var express = require('express');
var router = express.Router();
var authenticate = require('../model/authenticate');
var kidModel=require('../model/kidModel');
var verifySession = function (req, res, next) {
    if (req.session.isLogged != undefined)
        next();
    else
        res.redirect('/login');
};

router.get('/', verifySession, function (req, res) {
    if(req.session.type=='parent'){
        res.send('unavailable');
        return;
    }
    var kidInstance=new kidModel();
    kidInstance.get_notifications(req.session.id_user).then(function(response){
        res.render('generate_kid_code',{title:response.kid_location_and_name.username});
    })
    .catch(function(error){
        res.send(error.message);
    });

});
router.post('/',verifySession,function(req,res){
   if(req.session.type=='parent'){
       var kid = req.query.kid;
        res.send("unavailable");
   }
    if(req.session.type=='kid'){
       var token= tokens.new_token(req.session.id_user);
        res.send(token);

    }
});

module.exports=router;