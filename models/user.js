// Load required packages
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

// Define our beer schema
var UserSchema   = new mongoose.Schema({
  username: String,
  minutes: Number,
  currency: Number,
});

UserSchema.plugin(timestamps,{ createdAt: "created_at", updatedAt: "updated_at" });

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
