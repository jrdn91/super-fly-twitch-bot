var config = require('../../config');

var Moment = require('moment');

var mongoose = require('mongoose');
var Command = require('../../models/command');
var Message = require('../../models/message');
var User = require('../../models/user');


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

var currencyInterval = null;

var activeChatterTimestamps = {};

module.exports.startBot = function(req,res){
  // Connect chatBot
  chatBot.connect();
  chatBot.once('join', function(channel, username){
    isConnected = true;
    chatBot.color("channel", "Firebrick");
    // chatBot.action(channel, 'Hello there!');
    activeChatterTimestamps = {};
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
      if(docs.length > 0){
        for (var i = 0; i < docs.length; i++) {
          chatBot.action(config.channels[0], docs[i].messageContent);
        }
      }
    });
  },60000);
  // Currency
  currencyInterval = setInterval(function(){
    chatBot.api({
      url:"http://tmi.twitch.tv/group/user/"+config.channels[0]+"/chatters",
    },function(req,res,body){
      var body = JSON.parse(body);
      var currentViewers = body.chatters.viewers.concat(body.chatters.moderators);
      var currentTimestamp = Moment(new Date()).format('HH:mm:ss');
      var activeViewers = currentViewers.map(function(user){
        if(user in activeChatterTimestamps){
          var userTimestamp = activeChatterTimestamps[user];
          var duration = Moment.duration(Moment(currentTimestamp,'HH:mm:ss').diff(Moment(userTimestamp,'HH:mm:ss')));
          var elapsedTime = duration.asMinutes();
          if(elapsedTime < 10){
            return user;
          }
        }
      });
      User.update({'username':{$in:activeViewers}},{$inc:{currency:1,minutes:1}},{ multi: true },function(err,docs){
        if(err){
          console.log(err);
          return true;
        }
      });
    });
  },60000);
};
module.exports.stopBot = function(req,res){
  // Disconnect chatBot
  chatBot.action(config.channels[0],"I'm out!");
  chatBot.disconnect();
  chatBot.once('disconnected', function(reason){
    isConnected = false;
    clearInterval(messagesInterval);
    clearInterval(currencyInterval);
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
chatBot.on('chat',function(channel, user, message, self){
  if(self){
    return true;
  }
  activeChatterTimestamps[user.username] = Moment(new Date()).format('HH:mm:ss');
});
chatBot.on(null, function(channel, user, message, self){
  if(self){
    return true;
  }
  // Check if is broadcaster or mod
  var isBroadcaster = (user.username == config.channels[0] ? true : false);
  var isMod = (user['user-type'] == 'mod' ? true : false);

  // Add this chat message timestamp to the active chatters object
  // if(!isBroadcaster){
    activeChatterTimestamps[user.username] = Moment(new Date()).format('HH:mm:ss');
  // }

  // Return if there is not a command
  if(!message.match(/^!\w+/g)){
    // Moderate messages
    if(urlRegex.test(message) && (!isBroadcaster && !isMod)){
      chatBot.timeout(channel, user.username, 1);
      chatBot.action(channel, "Please do not post URL's in the chat.");
    }
    return true;
  }

  // array of words in the message
  var words = message.split(' ');

  // command variable
  var command = words[0];

  // Commands that are for admins only
  var specialCommands = ['!addcom','!editcom','!delcom','!joinbank','!balance','!leavebank'];

  // Check if command is an admin command
  if(specialCommands.indexOf(command) > -1){
    var canUseAdminCommand = function() {
      if(!isBroadcaster && !isMod){
        return false;
      }else{
        return true;
      }
    }
    // Switch over the command and do admin functions
    switch (command) {
      case '!addcom':
        if (!canUseAdminCommand){
          chatBot.action(channel, "You do not have permission to use that command.");
          return true;
        }
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
            chatBot.action(channel, "There was a problem creating this command.");
            return true;
          }
          chatBot.action(channel, "Command "+commandTrigger+" has been created.");
        });
      break;
      case '!editcom':
        if (!canUseAdminCommand){
          chatBot.action(channel, "You do not have permission to use that command.");
          return true;
        }
        var commandResponseEdit = message.match(/!\S+\s*([^!]+)$/)[1];
        Command.update({
          commandTrigger: words[1]
        }, {
          commandResponse: commandResponseEdit
        }, function(err){
          if(err) {
            chatBot.action(channel, "There was a problem editing this command.");
            return true;
          }
          var updatedMessage = template("The ${command} command has been updated.",{command: words[1]});
          chatBot.action(channel, updatedMessage);
        });
      break;
      case '!delcom':
        if (!canUseAdminCommand){
          chatBot.action(channel, "You do not have permission to use that command.");
          return true;
        }
        Command.findOneAndRemove({
          commandTrigger: words[1]
        }, function(err){
          if(err) {
            chatBot.action(channel, "There was a problem deleting this command.");
            return true;
          }
          var deletedMessage = template("The ${command} command has been removed.",{command: words[1]});
          chatBot.action(channel, deletedMessage);
        });
      break;
      case '!joinbank':
        // user wants to start collecting currency
        User.findOne({username: user.username},function(err, foundUser){
          if (err) {
            console.log(err);
            return true;
          }
          if(foundUser){
            // The user is already in the bank
            var memberMessage = template("You are already in the bank, you've been a member since ${time} and you have logged ${minutes} minutes and have a total of ${currency} Tax Dollars.",{time: Moment(foundUser.created_at).format('MMMM DD, YYYY'),minutes: foundUser.minutes, currency: foundUser.currency});
            chatBot.action(channel, memberMessage);
          }else{
            // The user is not in the bank
            var newUser = new User({
              username: user.username
            });
            newUser.save(function(err) {
              if (err) {
                console.log(err);
                return true;
              }
              var joinMessage = template("You have been added to the bank.");
              chatBot.action(channel, joinMessage);
            });
          }
        });
      break;
      case '!leavebank':
        // user wants to start collecting currency
        User.findOne({username: user.username}).remove(function(err){
          if (err) {
            res.send(err);
          }
          var leaveMessage = template("You have been removed from the bank and will no longer accumulate currency.");
          chatBot.action(channel, leaveMessage);
        });
      break;
      case '!balance':
        // user wants to start collecting currency
        User.findOne({username: user.username},function(err, foundUser){
          if (err) {
            console.log(err);
            return true;
          }
          if(foundUser){
            // The user has been found in the bank
            var memberMessage = template("You have a total of ${currency} Tax Dollars and have logged ${minutes} minutes. You have been a member since ${time}.",{time: Moment(foundUser.created_at).format('MMMM DD, YYYY'),minutes: foundUser.minutes, currency: foundUser.currency});
            chatBot.action(channel, memberMessage);
          }else{
            // The user is not in the bank
            var noUserMessage = template("You are not in the bank and do not have any currency, you can join the bank by typing !joinbank.");
            chatBot.action(channel, noUserMessage);
          }
        });
      break;
      default:
        chatBot.action(channel, "This command is not yet implemented.");
      break;
    }
    return true;
  }

  // Respond function
  var respond = function(docs){
    var chatResponse = docs[0].commandResponse;
    var response = template(chatResponse, {user: user.username, channel: channel, message: message});
    chatBot.action(channel, response);
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
          chatBot.action(channel, permissionError);
        }
      }
    }else{
      // Command was not found
      var commandString = message.match(/!\w+/g);
      var error = template("Sorry ${command} is not a valid command.",{command: commandString});
      chatBot.action(channel, error);
    }
  });
});
