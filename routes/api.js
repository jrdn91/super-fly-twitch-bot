var express = require('express');
var router = express.Router();

// API's
var bot = require('./api/bot');
var commands = require('./api/command');

// Endpoints
router.route('/bot')
  .post(function(req,res) { bot.startBot(req,res) })
  .delete(function(req,res) { bot.stopBot(req,res) });

router.route('/commands')
  .post(function(req,res) { commands.addCommand(req,res) })
  .get(function(req,res) { commands.getAllCommands(req,res) });

router.route('/commands/:command_id')
  .put(function(req,res) { commands.updateCommand(req,res,req.params.command_id) })
  .delete(function(req,res) { commands.deleteCommand(req,res,req.params.command_id) });

module.exports = router;
