var mongoose = require('mongoose');
var User = require('../../models/user');

module.exports.addUser = function(req, res) {
  var user = new User(req.body.user);

  user.save(function(err) {
    if (err)
      res.send(err);
    res.json({user: user});
  });
};

module.exports.getAllUsers = function(req, res) {
  User.find(function(err, users) {
      if (err) {
        res.send(err);
      }
      res.json({users: users});
  });
};

module.exports.updateUser = function(req, res, username) {
  User.findByIdAndUpdate(id, {$set: req.body.user}, function(err, user) {
    if (err) {
      res.send(err);
    }
    res.json({user: user});
  });
};

module.exports.getUser = function(req, res, username) {
  User.find({username:username},function(err, users) {
      if (err) {
        res.send(err);
      }
      res.json({users: users});
  });
};

module.exports.deleteUser = function(req, res, id) {
  User.findByIdAndRemove(id, function(err) {
    if (err) {
      res.send(err);
    }
    res.sendStatus(200);
  });
};
