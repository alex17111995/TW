/**
 * Created by Ciubi on 28/03/16.
 */
var express = require('express');
var db=require('../model/dbconnect');
var router = express.Router();

/* GET users listing. */
var verifyAlreadyLogged=function(req,res,next){
    if(req.session.isLogged==true){
        res.redirect('/');
        return;
    }
    next();
}

router.get('/',verifyAlreadyLogged, function(req, res, next) {
    res.render('login', {title: 'Login'});
});

router.post('/',verifyAlreadyLogged,function(req,res,next){
    //TODO checkDB



    db.validUser(req.body.username,req.body.password,function(id){
        req.session.username=req.body.username;
        req.session.isLogged=true;
        res.send('OK');
    },function(){
        res.send('KO');
    });
    //db.blablabla();

});


router.get('/register',verifyAlreadyLogged, function(req, res, next) {
    res.render('login', {title: 'Register'});
});
router.post('/register',verifyAlreadyLogged, function (req,res,next) {
//TODO
});

module.exports=router;