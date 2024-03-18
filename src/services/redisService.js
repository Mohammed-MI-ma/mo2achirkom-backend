// src/services/redisService.js
const redis = require("redis");
const client = redis.createClient();

exports.getImage = (id) => {
  return new Promise((resolve, reject) => {
    client.get(id, (err, imageData) => {
      if (err) {
        reject(err);
      } else {
        resolve(imageData);
      }
    });
  });
};
