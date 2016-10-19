/**
 * Created by Peter on 26/08/15.
 */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var morgan =  require('morgan');
var cookieParser =  require('cookie-parser');

var SERVER = require('./config').SERVER;
var port = process.env.PORT || SERVER.PORT || 5000;
var environment = process.env.NODE_ENV;

var MONGO_DB = require('./config').MONGO_DB;
var mongoose = require('mongoose');
console.log('mongodb uri ==', MONGO_DB.MONGO_URI);
mongoose.connect(MONGO_DB.MONGO_URI); // connect to our database


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms

app.use(express.static('./src/public/'));

// app.get('/api/tweet', (req, res) => {
//   res.send('rooty tooty');
// })

// passport init
var passport = require('./passport')(app);
require('./routes/routes.js')(app, passport);

app.listen(port, function() {
  console.log('Server started at port ', port);
});
