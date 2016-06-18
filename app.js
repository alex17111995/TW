var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var forgot_password = require('./routes/forgot_password');
var reset_password=require('./routes/reset-password');
var generate_kid_code=require('./routes/generate_kid_code');
var fblogin = require('./routes/facebook-auth');
var new_target = require('./routes/new_target');
var logout = require('./routes/sign-out');
var update_position = require('./routes/update-position');
var ajax_notification = require('./routes/ajax-get-notification');
var session = require('express-session');
var app = express();
var passport = require('passport');

var crypto = require('crypto');
var bdConnect = require('./model/dbconnect')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.locals.pretty = true;

var session_middleware = session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
});
app.use(session_middleware);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/users', users);
app.use('/login', login);
app.use('/ajax-get-notification', ajax_notification);
app.use('/update', update_position);
app.use('/new_target', new_target);
app.use('/facebook', fblogin);
app.use('/logout', logout);
app.use('/forgot_password', forgot_password);
app.use('/reset-password',reset_password);
app.use('/generate-kid-code',generate_kid_code);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = {
    'app': app,
    'session_middleware': session_middleware
};
