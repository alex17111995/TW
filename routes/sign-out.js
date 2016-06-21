/**
 * Created by Ciubi on 17/06/16.
 */

var express = require('express');
var router = express.Router();


router.post('/', function (req, res, next) {

    req.session.destroy(function(err) {
        res.redirect('/');
    });
});
module.exports=router;