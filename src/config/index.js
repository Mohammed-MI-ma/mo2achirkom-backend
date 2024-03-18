require("dotenv").config({ path: ".env.dev" });

module.exports = {
  DB: process.env.DB_URI_DEV,
  SECRET: process.env.SECRET_DEV,
  TOKEN_EXPIRATION: process.env.TOKEN_EXPIRATION_DEV,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION_DEV,
  REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT_DEV,
};
