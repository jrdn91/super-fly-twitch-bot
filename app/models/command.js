// Load required packages
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

// Define our beer schema
var CommandSchema   = new mongoose.Schema({
  commandTrigger: String,
  commandResponse: String,
  commandPermission: String
});

CommandSchema.plugin(timestamps,{ createdAt: "created_at", updatedAt: "updated_at" });

// Export the Mongoose model
module.exports = mongoose.model('Command', CommandSchema);
