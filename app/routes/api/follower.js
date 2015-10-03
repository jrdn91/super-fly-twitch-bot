var mongoose = require('mongoose');
var Follower = require('../../models/follower');

module.exports.addFollower = function(req, res) {
  var follower = new Follower(req.body.follower);

  follower.save(function(err) {
    if (err)
      res.send(err);
    res.json({follower: follower});
  });
};

module.exports.getAllFollowers = function(req, res) {
  Follower.find(function(err, followers) {
      if (err) {
        res.send(err);
      }
      res.json({followers: followers});
  });
};

module.exports.updateFollower = function(req, res, id) {
  Follower.findByIdAndUpdate(id, {$set: req.body.follower}, function(err, follower) {
    if (err) {
      res.send(err);
    }
    res.json({follower: follower});
  });
};

module.exports.getFollower = function(req, res, id) {
  Follower.findById(id,function(err, follower) {
      if (err) {
        res.send(err);
      }
      res.json({followers: followers});
  });
};

module.exports.deleteFollower = function(req, res, id) {
  Follower.findByIdAndRemove(id, function(err) {
    if (err) {
      res.send(err);
    }
    res.sendStatus(200);
  });
};
