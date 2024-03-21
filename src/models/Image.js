// src/models/imageModel.js
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  keyword: {
    type: String,
  },

  imageData: {
    type: Buffer,
    required: true,
    validate: {
      validator: function (value) {
        // Check if the size of the binary image data is less than or equal to the maximum allowed size
        return value.length <= 102400;
      },
      message: "Image data exceeds the maximum allowed size",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
