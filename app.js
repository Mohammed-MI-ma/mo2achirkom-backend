// This line imports the 'cluster' module, which is used for creating a cluster of child processes to take advantage of multi-core systems.

const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
  // If the current process is the master process, create worker processes.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  // Listen for when a worker process exits and create a new one to replace it.
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const cors = require("cors");
  const exp = require("express");
  const i18n = require("i18n");
  const path = require("path");
  const passport = require("passport");
  const { connect } = require("mongoose");
  const { success, error } = require("consola");
  const generateSwagger = require("./src/generateSwagger");
  const compression = require("compression");
  const { DB, REQUEST_TIMEOUT } = require("./src/config");
  const PORT = 5000;
  const swaggerRoute = require("./src/routes/swagger");

  const app = exp();
  // Configure i18n
  const translationsPath = path.join(__dirname, "./src/i18n/");
  i18n.configure({
    directory: translationsPath,
    defaultLocale: "ar", // Default locale
  });

  // Use i18n middleware
  app.use(i18n.init);
  app.use(
    cors({
      origin: "http://localhost:3000", // Replace with your React app's URL
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
    })
  );

  app.use(compression());
  app.use(exp.json());
  app.use(exp.static("public"));
  app.use(exp.urlencoded({ extended: true }));
  app.use(passport.initialize());

  // Create an HTTP server
  const server = http.createServer(app);

  app.get("/", (req, res) => {
    res.send("Server running");
  });

  app.use("/api", require("./src/routes"));
  app.use("/api-docs", swaggerRoute);

  const startApp = async () => {
    try {
      await connect(DB, {
        serverSelectionTimeoutMS: REQUEST_TIMEOUT,
      });

      success({
        message: `Successfully connected with the Database \n${DB}`,
        badge: true,
      });
      generateSwagger(app);

      // Start listening for the server on PORT
      server.listen(PORT, () =>
        success({ message: `Server started on PORT ${PORT}`, badge: true })
      );
    } catch (err) {
      error({
        message: `Unable to connect with Database \n${err}`,
        badge: true,
      });
      startApp();
    }
  };

  startApp();
}
