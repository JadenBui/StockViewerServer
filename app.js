require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const options = require("./knexfile.js");
const knex = require("knex")(options);
const helmet = require("helmet");
const cors = require("cors");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

// const swaggerUI = require("swagger-ui-express");
// const yaml = require("yamljs");
// const swaggerDocument = yaml.load("./docs/swagger.yaml");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("common"));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

logger.token("req", (req, res) => JSON.stringify(req.headers));
logger.token("res", (req, res) => {
  const headers = {};
  res.getHeaderNames().map((h) => (headers[h] = res.getHeader(h)));
  return JSON.stringify(headers);
});

app.use((req, res, next) => {
  req.db = knex;
  next();
});

app.use("/stocks", indexRouter);
app.use("/user", usersRouter);
app.get("/", (req, res) => {
  res.send("Welcome to my web stock server");
});
// app.use("/", swaggerUI.serve);
// app.get("/", swaggerUI.setup(swaggerDocument));

//handle invalid route
app.use(function (req, res, next) {
  res.status(404).json({
    error: true,
    message: `The route ${req.originalUrl} is invalid! Please check again.`,
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
