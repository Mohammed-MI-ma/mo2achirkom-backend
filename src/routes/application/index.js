// Assuming you have initialized and connected to MongoDB using Mongoose or another MongoDB client

const express = require("express");
const redis = require("ioredis");
const client = redis.createClient();
const router = express.Router();
const { userAuth, checkRole } = require("../../controllers/auth");
const imageController = require("../../Controllers/imageController");
const ROLE = require("../../config/roles");

const ImageModel = require("../../models/Image"); // Assuming you have a MongoDB model for images
const cacheImagesByKeyword = require("../../middleware/cacheMiddleware");
/**
 * @swagger
 * /api/images:
 *   post:
 *     summary: Create an image
 *     description: Endpoint to upload and create an image
 *     tags:
 *       - Images
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Image created successfully
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 */
router.post("/", userAuth, checkRole([ROLE.user]), imageController.createImage);
/**
 * @swagger
 * /api/images/{keyword}:
 *   get:
 *     summary: Get images by keyword
 *     description: Retrieve images based on the provided keyword
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         description: Keyword to search for images
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates whether the request was successful
 *                 message:
 *                   type: string
 *                   description: Message describing the result
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         description: URL of the image
 *                       description:
 *                         type: string
 *                         description: Description of the image
 *                       keyword:
 *                         type: string
 *                         description: Keyword associated with the image
 */
router.get(
  "/images/:keyword",
  cacheImagesByKeyword,
  imageController.getImagesByKeyword
);
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
