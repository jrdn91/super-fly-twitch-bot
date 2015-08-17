var express = require('express');
var router = express.Router();

// API's
var bot = require('./api/bot');

// Endpoints
router.route('/bot')
    .post(function(req,res) { bot.startBot(req,res) })
    .delete(function(req,res) { bot.stopBot(req,res) });

module.exports = router;
