var mongoose = require('mongoose');
var User = require('../../models/user');

module.exports.addUser = function(req, res) {
  var user = new User(req.body.user);

  console.log(req.body.user);

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
  User.findOne({username: username}, function(err, user) {
    if (err) {
      res.send(err);
    }
    user.currency = req.body.user.currency;
    user.minutes = req.body.user.minutes;
    user.save(function(err){
      if (err) {
        res.send(err);
      }
      res.json({user: user});
    });
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

module.exports.deleteUser = function(req, res, username) {
  User.find({username: username}).remove(function(err){
    if (err) {
      res.send(err);
    }
    res.sendStatus(200);
  });
};
