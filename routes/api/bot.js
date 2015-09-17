var config = require('../../config');

var mongoose = require('mongoose');
var Command = require('../../models/command');
var Message = require('../../models/message');


// Regex's
var urlRegex = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/;

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

var minutes = null;
var messagesInterval = null;

module.exports.startBot = function(req,res){
  // Connect chatBot
  chatBot.connect();
  chatBot.once('join', function(channel, username){
    isConnected = true;
    chatBot.say(channel, 'Hello there!');
    if (req.socket.writable)
      res.json({action:'joined'});
  });
  // Messages
  minutes = 0;
  messagesInterval = setInterval(function(){
    minutes++;
    var Messages;
    Message.find({active: true}).$where(minutes+' % this.interval === 0').exec(function(err,docs){
      if(err){
        console.log(err);
        return true;
      }
      console.log(docs);
      if(docs.length > 0){
        for (var i = 0; i < docs.length; i++) {
          chatBot.say(config.channels[0], docs[i].messageContent);
        }
      }
    });
  },60000);
};
module.exports.stopBot = function(req,res){
  // Disconnect chatBot
  chatBot.say(config.channels[0],"I'm out!");
  chatBot.disconnect();
  chatBot.once('disconnected', function(reason){
    isConnected = false;
    // clearInterval(messagesInterval);
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
  // Check if is broadcaster or mod
  var isBroadcaster = (user.username == config.channels[0] ? true : false);
  var isMod = (user['user-type'] == 'mod' ? true : false);

  // Return if there is not a command
  if(!message.match(/^!\w+/g)){
    // Moderate messages
    if(urlRegex.test(message) && (!isBroadcaster && !isMod)){
      chatBot.timeout(channel, user.username, 1);
      chatBot.say(channel, "Please do not post URL's in the chat.");
    }
    return true;
  }

  // array of words in the message
  var words = message.split(' ');

  // command variable
  var command = words[0];

  // Commands that are for admins only
  var specialCommands = ['!addcom','!editcom','!delcom','!joinbank'];

  // Check if command is an admin command
  if(specialCommands.indexOf(command) > -1){
    if(!isBroadcaster && !isMod){
      // Return if user does not have permission
      chatBot.say(channel, "You do not have permission to use that command.");
      return true;
    }
    // Switch over the command and do admin functions
    switch (command) {
      case '!addcom':
        var userLevel = null;
        var commandTrigger = words[1];
        var commandResponse = message.match(/!\S+\s*([^!]+)$/)[1];
        if(words[1].match(/-ul=(\w+)/)){
          // User level for command is defined
          userLevel = words[1].match(/-ul=(\w+)/)[1];
          commandTrigger = words[2];
        }
        var newCommand = new Command({commandTrigger:commandTrigger,commandResponse:commandResponse,commandPermission:userLevel});
        newCommand.save(function(err){
          if(err) {
            chatBot.say(channel, "There was a problem creating this command.");
            return true;
          }
          chatBot.say(channel, "Command "+commandTrigger+" has been created.");
        });
      break;
      case '!editcom':
        var commandResponseEdit = message.match(/!\S+\s*([^!]+)$/)[1];
        Command.update({
          commandTrigger: words[1]
        }, {
          commandResponse: commandResponseEdit
        }, function(err){
          if(err) {
            chatBot.say(channel, "There was a problem editing this command.");
            return true;
          }
          var updatedMessage = template("The ${command} command has been updated.",{command: words[1]});
          chatBot.say(channel, updatedMessage);
        });
      break;
      case '!delcom':
        Command.findOneAndRemove({
          commandTrigger: words[1]
        }, function(err){
          if(err) {
            chatBot.say(channel, "There was a problem deleting this command.");
            return true;
          }
          var deletedMessage = template("The ${command} command has been removed.",{command: words[1]});
          chatBot.say(channel, deletedMessage);
        });
      break;
      default:
        chatBot.say(channel, "This command is not yet implemented.");
      break;
    }
    return true;
  }

  // Respond function
  var respond = function(docs){
    var chatResponse = docs[0].commandResponse;
    var response = template(chatResponse, {user: user.username, channel: channel, message: message});
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
