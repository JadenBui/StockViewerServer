var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/swaggerpet.json')

var app = express();

const options = require('./knexfile');
const knex = require('knex')(options);
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//logger
app.use(logger('dev'));


logger.token('req',(req,res) => JSON.stringify(req.headers));
logger.token('res',(req,res) => {
  const headers = {};
  res.getHeaderNames().map(h => headers[h] = res.getHeader(h));
  return JSON.stringify(headers);
})

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/docs',swaggerUI.serve,swaggerUI.setup(swaggerDocument));

app.use((req,res,next)=>{
  req.db = knex;
  next();
});

app.use(helmet());
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log("App")

module.exports = app;
