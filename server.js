var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var logger = require('morgan');
// var passport = require('passport');

var apiVersion = 1;

var mongoDB = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/twitchbot';
mongoose.connect(mongoDB);

var app = express();

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Logging
app.use(logger('dev'));

// CORS
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    }
    else {
      next();
    }
};
app.use(allowCrossDomain);

var api = require('./app/routes/api');

app.use('/api/v'+apiVersion, api);
app.use('/assets', express.static(__dirname + '/client/assets'));
app.use(function(req, res, next) {
  res.sendfile(__dirname + '/client/index.html');
});

var port = process.env.PORT || 3000;
app.listen(port);