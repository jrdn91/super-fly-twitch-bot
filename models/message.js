// Load required packages
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

// Define our beer schema
var MessageSchema   = new mongoose.Schema({
  title: String,
  messageContent: String,
  interval: Number,
  active: Boolean
});

MessageSchema.plugin(timestamps,{ createdAt: "created_at", updatedAt: "updated_at" });

// Export the Mongoose model
module.exports = mongoose.model('Message', MessageSchema);
