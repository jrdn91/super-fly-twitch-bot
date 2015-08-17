var express = require('express');
// var mongoose = require('mongoose');
var bodyParser = require('body-parser');
// var passport = require('passport');

var apiVersion = 1;

// mongoose.connect('mongodb://localhost:27017/beerlocker');

var app = express();

// Body Parser
app.use(bodyParser.urlencoded({
  extended: true
}));

// CORS
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};
app.use(allowCrossDomain);

var api = require('./routes/api');

app.use('/api/v'+apiVersion, api);

app.listen(3000);
