var mongoose = require('mongoose');
var Message = require('../../models/message');

module.exports.addMessage = function(req, res) {
  var message = new Message(req.body.message);

  message.save(function(err) {
    if (err)
      res.send(err);
    res.json({message: message});
  });
};

module.exports.getAllMessages = function(req, res) {
  Message.find(function(err, message) {
      if (err) {
        res.send(err);
      }
      res.json({message: message});
  });
};

module.exports.updateMessage = function(req, res, id) {
  Message.findByIdAndUpdate(id, {$set: req.body.message}, function(err, message) {
    if (err) {
      res.send(err);
    }
    res.json({message: message});
  });
};

module.exports.deleteMessage = function(req, res, id) {
  Message.findByIdAndRemove(id, function(err) {
    if (err) {
      res.send(err);
    }
    res.sendStatus(200);
  });
};
