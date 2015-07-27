var config = require('./config');

var irc = require('twitch-irc');
var template = require('es6-template-strings');
var Promise = require('promise');

var Commands = require('./commands');
var Messages = require('./messages');

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

db = {};
db.commands = new Datastore('database/commands.db');
db.messages = new Datastore('database/messages.db');

db.commands.loadDatabase();
db.messages.loadDatabase();

// Command Functions
var functions = require('./functions');

client.connect();

client.addListener('chat', function(channel, user, message){
  // Return if there is not a command
  if(!message.match(/!\w+/g)){
    return true;
  }

  // array of words in the message
  var words = message.split(' ');

  // command variable
  var command = words[0];

  // Commands that are for admins only
  var adminCommands = ['!addcom','!editcom','!delcom','!addmes','!editmes','!delmes'];

  // Check if command is an admin command
  if(adminCommands.indexOf(command) > -1){
    if(user.special.indexOf('broadcaster') == -1 && user.special.indexOf('mod') == -1){
      // Return if user does not have permission
      client.say(channel, "You do not have permission to use that command.");
      return true;
    }
    // Switch over the command and do admin functions
    switch (command) {
      case '!addcom':
        var userLevel = null;
        var commandTrigger = words[1];
        var commandResponse = message.match(/([A-Z])[\w\s]+/)[0];
        if(words[1].match(/-ul=/g)){
          // User level for command is defined
          userLevel = words[1].split(/-ul=/g)[1];
          commandTrigger = words[2];
        }
        db.commands.insert({
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
  db.commands.find({trigger: command}, function(err, docs){
    if(err){
      return true;
    }
    // If a command is returned from the database
    if(docs.length > 0){
      // Check if user has permission to use this command
      if(!docs[0].permission || user.special.indexOf('broadcaster') > -1){
        // There is not a permission or the user is the broadcaster
        respond(docs);
      }else{
        // There is a permission
        console.log(user);
        console.log(docs[0].permission);
        if(user.special.indexOf(docs[0].permission) > -1){
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

// client.addListener('chat', function(channel, user, message) {
//   // Setup permission helpers
//   var isBroadcaster = false;
//   user.special.map(function(e){
//     if(e == 'broadcaster'){
//       isBroadcaster = true;
//     }
//   });
//   var words = message.split(' ');
//   if(words[0].match(/!\w+/g)){
//     // Filter through commands and try to find one
//     var command = Commands.filter(function(el) {
//       return el.trigger === words[0].toLowerCase();
//     });
//     var respond = function() {
//       if(typeof(command[0].response) == "function"){
//         command[0].response(words).then(function(res){
//           var response = template(res, {user: user, channel: channel, message: message});
//           client.say(channel, response);
//         });
//       }else{
//         var response = template(command[0].response, {user: user, channel: channel, message: message});
//         client.say(channel, response);
//       }
//     };
//     if(command[0]){
//       // A command was returned by our filter so check if user has permission
//       if(!command[0].permission || isBroadcaster){
//         // There is no permission restriction or the user is the broadcaster
//         respond();
//       }else{
//         // There is a permission so lets check if the user has a required permission
//         var hasPermission = false;
//         user.special.map(function(el){
//           if(el == command[0].permission){
//             hasPermission = true;
//           }else{
//             hasPermission = false;
//           }
//         });
//         if(hasPermission){
//           respond();
//         }else{
//           var permissionCommandString = message.match(/!\w+/g);
//           var permissionError = template("You do not have permission to use the ${command} command.",{command: permissionCommandString});
//           client.say(channel, permissionError);
//         }
//       }
//     }else{
//       // A command was not found so let the user know
//       var commandString = message.match(/!\w+/g);
//       var error = template("Sorry ${command} is not a valid command.",{command: commandString});
//       client.say(channel, error);
//     }
//   }
// });

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
  for(var i in Messages){
    if(Messages[i].active){
      if(minutes % Messages[i].interval === 0){
        client.say(config.channels[0], Messages[i].message);
      }
    }
  }
},60000);
