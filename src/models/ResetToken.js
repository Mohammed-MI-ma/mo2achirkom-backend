// models/ResetToken.js

const mongoose = require("mongoose");

const resetTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiration: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResetToken", resetTokenSchema);
