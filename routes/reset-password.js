/**
 * Created by Ciubi on 18/06/16.
 */
var tokens=require('../model/forgotten_password_tokens');
var express = require('express');
var router = express.Router();
var authenticate = require('../model/authenticate');
var ensure_valid_token=function(req,res,next){
    var token=req.query.token;
    if(!tokens.is_valid_token(token))
        res.send('Invalid Token');
    else next();
};

router.get('/',ensure_valid_token,function(req,res){
    res.render('reset-password');
});
router.post('/',ensure_valid_token,function(req,res){
    authenticate.change_password_user(tokens.get_token_username(req.query.token),req.body.password).then(function(successful){
        tokens.delete_token(req.query.token);
        res.send('successful change of password');
    })
    .catch(function(error){
       res.send(error);
    });
});

module.exports=router;
