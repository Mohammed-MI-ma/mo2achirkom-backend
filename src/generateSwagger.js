const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0", // Specify the OpenAPI version
    info: {
      title: "API Documentation for the Mo2achirkom SAAS Platform", // Specify the title of your API
      version: "1.0.0", // Specify the version of your API
      description:
        "Comprehensive API documentation providing developers with the necessary endpoints and data structures to seamlessly integrate with the Mo2achirkom SAAS (Software as a Service) platform. Explore detailed information on authentication, data retrieval, and manipulation functionalities to facilitate efficient and effective integration with the Mo2achirkom ecosystem",
    },
    servers: [
      {
        url: "http://localhost:5000", // Specify the URL where your API is hosted
      },
    ],
  },
  // Paths to the API routes and their annotations
  apis: ["./src/routes/application/*.js", "./src/routes/auth/*.js"], // Replace with the actual path to your route files
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = (app) => {
  // Serve the Swagger UI at the /api-docs route
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
