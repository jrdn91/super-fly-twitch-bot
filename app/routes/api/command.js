var mongoose = require('mongoose');
var Command = require('../../models/command');

module.exports.addCommand = function(req, res) {
  var command = new Command(req.body.command);

  console.log(req.body.command);

  command.save(function(err) {
    if (err)
      res.send(err);
    res.json({command: command});
  });
};

module.exports.getAllCommands = function(req, res) {
  Command.find(function(err, commands) {
      if (err) {
        res.send(err);
      }
      res.json({commands: commands});
  });
};

module.exports.updateCommand = function(req, res, id) {
  Command.findByIdAndUpdate(id, {$set: req.body.command}, function(err, command) {
    if (err) {
      res.send(err);
    }
    res.json({command: command});
  });
};

module.exports.deleteCommand = function(req, res, id) {
  Command.findByIdAndRemove(id, function(err) {
    if (err) {
      res.send(err);
    }
    res.sendStatus(200);
  });
};
