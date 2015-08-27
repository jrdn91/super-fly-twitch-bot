// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var CommandSchema   = new mongoose.Schema({
  commandTrigger: String,
  commandResponse: String,
  commandPermission: String
});

// Export the Mongoose model
module.exports = mongoose.model('Command', CommandSchema);
