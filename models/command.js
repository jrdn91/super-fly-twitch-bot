// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var CommandSchema   = new mongoose.Schema({
  trigger: String,
  response: String,
  permission: String
});

// Export the Mongoose model
module.exports = mongoose.model('Command', CommandSchema);
