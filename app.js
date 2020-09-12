const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const staticAsset = require('static-asset');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config');
const routes = require('./routes');
//const mocks = require('./mocks');


//database

mongoose.Promise = global.Promise;
mongoose.set('debug', config.IS_PRODUCTION);
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    autoIndex: false, // Don't build indexes
    poolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  };

mongoose.connection
.on('error', error => console.log(error))
.on('close', () => console.log('Database connection closed.'))
.once('open', () => {
  const info = mongoose.connections[0];
  console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
  //require('./mocks')();
},
mongoose.connect('mongodb+srv://GrinkoEvgenii:Canada985560@freespace.orzwh.mongodb.net/mongodb:blog?retryWrites=true&w=majority', options));
//express
const app = express();

//sessions
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    })
  })
);

//sets and uses
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(staticAsset(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, config.DESTINATION)));
app.use(
  '/javascripts',
  express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist'))
);
//routes
app.use('/', routes.archive);
app.use('/api/auth', routes.auth);
app.use('/post', routes.post);
app.use('/comment', routes.comment);
app.use('/upload', routes.upload);


//page 404 catch and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not found');
  err.status = 404;
  next(err)
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.render('error', {
    message: error.message,
    error: !config.IS_PRODUCTION ? error : {}
  });
});


app.listen(config.PORT, () => {
  console.log(`Example app listening on port ${config.PORT}!`)
});