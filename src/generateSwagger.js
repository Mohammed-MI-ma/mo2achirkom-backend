const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0", // Specify the OpenAPI version
    info: {
      title: "Your API", // Specify the title of your API
      version: "1.0.0", // Specify the version of your API
      description: "API documentation for Your API", // Provide a description
    },
    servers: [
      {
        url: "http://localhost:5000", // Specify the URL where your API is hosted
      },
    ],
  },
  // Paths to the API routes and their annotations
  apis: ["./routes/*/*.js"], // Replace with the actual path to your route files
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = (app) => {
  // Serve the Swagger UI at the /api-docs route
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
