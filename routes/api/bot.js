var config = require('../../config');

var irc = require('tmi.js');
// var fs = require('fs');
// var template = require('es6-template-strings');
// var Promise = require('promise');

var chatBotOptions = {
  options: {
    debug: true,
  },
  identity: {
    username: config.username,
    password: config.password
  },
  channels: config.channels
};
var chatBot = new irc.client(chatBotOptions);

module.exports.startBot = function(req,res){
  // Connect chatBot
  chatBot.connect();
  chatBot.on('join', function(channel, username){
    chatBot.say(channel, 'Hello there!');
    res.json({action:'joined'});
  });
};
module.exports.stopBot = function(req,res){
  // Disconnect chatBot
  chatBot.say(config.channels[0],"I'm out!");
  chatBot.disconnect();
  res.json({action:'disconnecting'});
};
// chatBot.on('disconnected',function(reason){
//   console.log('disconnected');
//   res.json({action:'disconnected',reason: reason});
// });
