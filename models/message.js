// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var MessageSchema   = new mongoose.Schema({
  title: String,
  message: String,
  interval: Number,
  active: Boolean
});

// Export the Mongoose model
module.exports = mongoose.model('Message', MessageSchema);
