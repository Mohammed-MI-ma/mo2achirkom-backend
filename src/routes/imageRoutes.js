// Assuming you have initialized and connected to MongoDB using Mongoose or another MongoDB client

const express = require("express");
const redis = require("ioredis");
const client = redis.createClient();
const router = express.Router();

const ImageModel = require("../models/imageModel"); // Assuming you have a MongoDB model for images

// Endpoint to serve images
router.get("/:imageName", async (req, res) => {
  const { imageName } = req.params;

  // Check if image exists in Redis cache
  client.get(imageName, async (err, image) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (image) {
      // Serve image from cache
      res.setHeader("Content-Type", "image/jpeg"); // Adjust content type as per your image type
      res.send(image);
    } else {
      // Image not found in cache, fetch from MongoDB and cache it
      try {
        const imageData = await ImageModel.findOne({ filename: imageName });
        if (imageData) {
          // Cache the fetched image
          client.set(imageName, imageData.data);
          res.setHeader("Content-Type", "image/jpeg"); // Adjust content type as per your image type
          res.send(imageData.data);
        } else {
          res.status(404).send("Image not found");
        }
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    }
  });
});

module.exports = router;
