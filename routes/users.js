var express = require('express');
var pubSub= require('../PubSub');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  var instance=pubSub.getInstance();
  instance.publish("alex");
  res.render('index', {title: 'Express'});
});


module.exports = router;
