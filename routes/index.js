var express = require('express');
var router = express.Router();
var pubSub= require('../PubSub')
var dbconnect = require('../model/dbconnect');
/* GET home page. */
router.get('/', function(req, res, next) {
  var instance=pubSub.getInstance();

    var callback=function(mesage) {
    instance.unsubscribe(callback);
    res.render('index', {title: 'Express'});
    clearTimeout(timeoutLongPolling);
    console.log(mesage);
  };
  var timeoutLongPolling=setTimeout(function () {

    instance.unsubscribe(callback);
    res.render('index', {title: 'Express'});
    console.log("No info");
  },3000);


  instance.subs(callback);

 // instance.publish("alex");


});


module.exports = router;
