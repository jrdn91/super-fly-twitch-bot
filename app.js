var config = require('./config');

var irc = require('twitch-irc');
var template = require('es6-template-strings');

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
  console.log(user);
  console.log(message);
  if(message.toLowerCase() == '!hello') {
    var response = template("Hello ${user.username}!", {user: user});
    client.say(channel, response);
  }
});
