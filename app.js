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

client.connect();

client.addListener('chat', function(channel, user, message) {
  // Setup permission helpers
  var isBroadcaster = false;
  user.special.map(function(e){
    if(e == 'broadcaster'){
      isBroadcaster = true;
    }
  });
  var words = message.split(' ');
  if(words[0].match(/!\w+/g)){
    // Filter through commands and try to find one
    var command = Commands.filter(function(el) {
      return el.trigger === words[0].toLowerCase();
    });
    var respond = function() {
      if(typeof(command[0].response) == "function"){
        command[0].response(words).then(function(res){
          var response = template(res, {user: user, channel: channel, message: message});
          client.say(channel, response);
        });
      }else{
        var response = template(command[0].response, {user: user, channel: channel, message: message});
        client.say(channel, response);
      }
    };
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
  }
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
  for(var i in Messages){
    if(Messages[i].active){
      if(minutes % Messages[i].interval === 0){
        client.say(config.channels[0], Messages[i].message);
      }
    }
  }
},60000);
