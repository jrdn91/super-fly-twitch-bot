var express = require('express');
var router = express.Router();

// API's
var bot = require('./api/bot');
var commands = require('./api/command');
var message = require('./api/message');
var user = require('./api/user');

// Endpoints
router.route('/bot')
  .get(function(req,res) { bot.checkConnectionStatus(req,res) })
  .post(function(req,res) { bot.startBot(req,res) })
  .delete(function(req,res) { bot.stopBot(req,res) });

router.route('/commands')
  .post(function(req,res) { commands.addCommand(req,res) })
  .get(function(req,res) { commands.getAllCommands(req,res) });

router.route('/commands/:command_id')
  .put(function(req,res) { commands.updateCommand(req,res,req.params.command_id) })
  .delete(function(req,res) { commands.deleteCommand(req,res,req.params.command_id) });

router.route('/messages')
	.post(function(req,res) { message.addMessage(req,res) })
	.get(function(req,res) { message.getAllMessages(req,res) });

router.route('/messages/:message_id')
  .put(function(req,res) { message.updateMessage(req,res,req.params.message_id) })
  .delete(function(req,res) { message.deleteMessage(req,res,req.params.message_id) });

router.route('/users')
  .post(function(req,res) { user.addUser(req,res) })
  .get(function(req,res) { user.getAllUsers(req,res) });

router.route('/users/:user_id')
  .put(function(req,res) { user.updateUser(req,res,req.params.user_id) })
  .delete(function(req,res) { user.deleteUser(req,res,req.params.user_id) });

module.exports = router;
