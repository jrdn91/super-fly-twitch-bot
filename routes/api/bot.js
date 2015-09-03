var config = require('../../config');

var mongoose = require('mongoose');
var Command = require('../../models/command');

var irc = require('tmi.js');
// var fs = require('fs');
var template = require('es6-template-strings');
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
var isConnected = false;

module.exports.startBot = function(req,res){
  // Connect chatBot
  chatBot.connect();
  chatBot.once('join', function(channel, username){
    isConnected = true;
    chatBot.say(channel, 'Hello there!');
    if (req.socket.writable)
      res.json({action:'joined'});
  });
};
module.exports.stopBot = function(req,res){
  // Disconnect chatBot
  chatBot.say(config.channels[0],"I'm out!");
  chatBot.disconnect();
  chatBot.once('disconnected', function(reason){
    isConnected = false;
    if (req.socket.writable)
      res.json({action:'disconnected',reason:reason});
  });
};
module.exports.checkConnectionStatus = function(req,res){
  if(isConnected){
    res.json({connected:true});
  }else{
    res.json({connected:false});
  }
}
chatBot.on('chat', function(channel, user, message, self){
  if(self){
    return true;
  }
  // Return if there is not a command
  if(!message.match(/!\w+/g)){
    return true;
  }

  // array of words in the message
  var words = message.split(' ');

  // command variable
  var command = words[0];

  // Respond function
  var respond = function(docs){
    var chatResponse = docs[0].commandResponse;
    var response = template(chatResponse, {user: user, channel: channel, message: message});
    chatBot.say(channel, response);
  };

  // Lookup command from the database
  Command.find({commandTrigger: command}, function(err, docs){
    if(err){
      return true;
    }
    // If a command is returned from the database
    if(docs.length > 0){
      // Check if user has permission to use this command
      if(!docs[0].permission || user['user-type'] == 'broadcaster'){
        // There is not a permission or the user is the broadcaster
        respond(docs);
      }else{
        // There is a permission
        if(user['user-type'] == docs[0].permission){
          respond(docs);
        }else{
          var permissionError = template("You do not have permission to use the ${command} command.",{command: command});
          chatBot.say(channel, permissionError);
        }
      }
    }else{
      // Command was not found
      var commandString = message.match(/!\w+/g);
      var error = template("Sorry ${command} is not a valid command.",{command: commandString});
      chatBot.say(channel, error);
    }
  });
});
