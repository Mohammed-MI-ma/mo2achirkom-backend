// src/controllers/imageController.js
const { getImage } = require("../services/redisService");

exports.getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const imageData = await getImage(id);
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
