var config = require('./config');

var irc = require('twitch-irc');
var template = require('es6-template-strings');

var Commands = [
  {
    trigger: '!hello',
    response: "Hello ${user.username}!",
    permission: 0
  }
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
  var command = Commands.filter(function(el) {
    return el.trigger === message.toLowerCase();
  });
  var response = template(command[0].response, {user: user, channel: channel, message: message});
  client.say(channel, response);
});
