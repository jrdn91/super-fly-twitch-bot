var config = require('./config');

var irc = require('twitch-irc');
var template = require('es6-template-strings');
var Promise = require('promise');

var Commands = require('./commands');

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
var donate = setInterval(function(){
  client.say(config.channels[0], "If you would like to help the stream out, donate at https://www.twitchalerts.com/donate/matax91 . All donations go toward the stream!");
},(15 * 60000));
// var multiestream = setInterval(function(){
//   client.say(config.channels[0], "Check out PhantomPunch808 as well at http://twitch.tv/phantompunch808. You can watch both of us and chat at http://multitwitch.tv/matax91/phantompunch808");
// },(5 * 60000));
var g2a = setInterval(function(){
  client.say(config.channels[0], "Did you know you can buy games cheap and come play with me or other great streamers? You can do so by buying games on g2a. Click this link to help me out and get games much cheaper than you ever expected. Http://g2a.com/matax");
},(20 * 60000));
var raidcall = setInterval(function(){
  client.say(config.channels[0], "You can join me and the community over voice chat for free in RaidCall! Click this link http://www.raidcall.com/go.php?sid=11423321 To download and connect to our free RaidCall group!");
},(20 * 60000));
