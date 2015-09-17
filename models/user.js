// Load required packages
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

// Define our beer schema
var UserSchema   = new mongoose.Schema({
  username: String,
  minutes: {type: Number, default: 0},
  currency: {type: Number, default: 0},
});

UserSchema.plugin(timestamps,{ createdAt: "created_at", updatedAt: "updated_at" });

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
