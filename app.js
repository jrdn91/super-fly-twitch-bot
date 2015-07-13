var config = require('./config');

var irc = require('twitch-irc');
var template = require('es6-template-strings');

/**
 ** Available User Roles **
   staff
   admin
   broadcaster
   global_mod
   mod `Moderator status will be detected after joining a channel and may take up to 30-45 seconds. (like the chat on twitch.tv)`
   subscriber
   turbo
**/

var Commands = require('./commands');

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

client.connect();

client.addListener('chat', function(channel, user, message) {
  // Setup permission helpers
  var isBroadcaster = false;
  user.special.map(function(e){
    if(e == 'broadcaster'){
      isBroadcaster = true;
    }
  });
  // Filter through commands and try to find one
  var command = Commands.filter(function(el) {
    return el.trigger === message.toLowerCase();
  });
  var respond = function() {
    var response = template(command[0].response, {user: user, channel: channel, message: message});
    client.say(channel, response);
  };
  console.log(user);
  if(command[0]){
    // A command was returned by our filter so check if user has permission
    if(!command[0].permission || isBroadcaster){
      // There is no permission restriction or the user is the broadcaster
      respond();
    }else{
      // There is a permission so lets check if the user has a required permission
      var hasPermission = false;
      user.special.map(function(el){
        if(el == command[0].permission){
          hasPermission = true;
        }else{
          hasPermission = false;
        }
      });
      if(hasPermission){
        respond();
      }else{
        var permissionCommandString = message.match(/!\w+/g);
        var permissionError = template("You do not have permission to use the ${command} command.",{command: permissionCommandString});
        client.say(channel, permissionError);
      }
    }
  }else{
    // A command was not found so let the user know
    var commandString = message.match(/!\w+/g);
    var error = template("Sorry ${command} is not a valid command.",{command: commandString});
    client.say(channel, error);
  }
});
