var express = require('express');
var router = express.Router();

// API's

var test = require('./api/test');

// Endpoints
router.route('/test')
    .get(function(req,res) { test.respond(req,res) });

module.exports = router;
