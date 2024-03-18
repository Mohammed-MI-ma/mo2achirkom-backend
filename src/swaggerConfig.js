module.exports = {
  definition: {
    swagger: "2.0", // Specify Swagger version
    info: {
      title: "Your API",
      version: "1.0.0",
      description: "API documentation for Your API",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  apis: ["./routes/auth/*.js", "./routes/vsb/*.js"], // Replace with the actual path to your route files
};
