const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");

router.use("/", swaggerUi.serve);

module.exports = router;
