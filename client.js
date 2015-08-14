var config = require('./config');

var irc = require('tmi.js');
var fs = require('fs');
var template = require('es6-template-strings');
var Promise = require('promise');

var beerMessages = [
  "Well, pour me another beer, thank you.",
  "I like beer!",
  "I could use a beer.",
  "Beer: I like mine like I like my women: dark and bitter!",
  "Beer: Proof that God wants us to be happy.",
  "Beer: Nectar of the Gods"
];

var clientOptions = {
  options: {
    debug: true,
  },
  identity: {
    username: config.username,
    password: config.password
  },
  channels: config.channels
};
var client = new irc.client(clientOptions);

// Database
var Datastore = require('nedb');

var commands = new Datastore({ filename: 'database/commands.db', autoload: true });


// Command Functions
var functions = require('./functions');

client.connect();

client.addListener('chat', function(channel, user, message, self){
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

  // Commands that are for admins only
  var adminCommands = ['!addcom','!editcom','!delcom'];

  // Check if command is an admin command
  if(adminCommands.indexOf(command) > -1){
    if(user.username != config.channels[0] && user['user-type'] != 'mod'){
      // Return if user does not have permission
      client.say(channel, "You do not have permission to use that command.");
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
        commands.insert({
          trigger: commandTrigger,
          response: commandResponse,
          permission: userLevel
        }, function(err,docs){
          if(err){
            client.say(channel, "There was a problem creating this command.");
            return true;
          }
          client.say(channel, "Command "+docs.trigger+" has been created.");
        });
      break;
      case '!editcom':
        var editCommandResponse = message.match(/!\S+\s*([^!]+)$/)[1];
        commands.update({
          trigger: words[1]
        }, {
          $set: {response: editCommandResponse},
        }, function(err,numUpdated){
          var updatedMessage = template("The ${command} command has been updated.",{command: words[1]});
          client.say(channel, updatedMessage);
        });
      break;
      case '!delcom':
        commands.remove({
          trigger: words[1]
        }, {}, function(err,docs){
          var deletedMessage = template("The ${command} command has been removed.",{command: words[1]});
          client.say(channel, deletedMessage);
        });
      break;
      default:
        client.say(channel, "This command is not yet implemented.");
      break;
    }
    return true;
  }

  // Respond function
  var respond = function(docs){
    var commandResponse = docs[0].response;
    if(commandResponse.indexOf('_') === 0){
      // The command should fire a function
      var commandFunctionName = commandResponse.split('_')[1];
      functions[commandFunctionName](words).then(function(res){
        var response = template(res, {user: user, channel: channel, message: message});
        client.say(channel, response);
      });
    }else{
      var response = template(commandResponse, {user: user, channel: channel, message: message});
      client.say(channel, response);
    }
  };

  // Lookup command from the database
  commands.find({trigger: command}, function(err, docs){
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
          client.say(channel, permissionError);
        }
      }
    }else{
      // Command was not found
      var commandString = message.match(/!\w+/g);
      var error = template("Sorry ${command} is not a valid command.",{command: commandString});
      client.say(channel, error);
    }
  });
});

// Beer listener
client.addListener('chat', function(channel, user, message){
  if(message.indexOf('beer') >= 0){
    client.say(channel, beerMessages[Math.floor(Math.random() * (beerMessages.length))]);
  }
});

// Messages
var minutes = 0;
var messagesInterval = setInterval(function(){
  minutes++;
  var Messages;
  fs.readFile('./messages.json', 'utf8', function (err, data) {
    if (err) throw err;
    Messages = JSON.parse(data);
    for(var i in Messages){
      if(Messages[i].active){
        if(minutes % Messages[i].interval === 0){
          client.say(config.channels[0], Messages[i].message);
        }
      }
    }
  });
},60000);
