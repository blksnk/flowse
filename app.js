require('dotenv').config();

const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');
const session      = require('express-session');
const flash        = require('connect-flash');
const bcrypt       = require('bcrypt');
const MongoStore   = require('connect-mongo')(session);
const passport     = require('passport');

// run the code inside "passport-setup.js"
require('./config/passport/passport-setup.js');
require('./config/passport/spotify-strategy.js');
require('./config/passport/lastfm-strategy.js');

mongoose
  .connect('mongodb://localhost/flowse', {useNewUrlParser: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup

app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));
      

hbs.registerPartials(path.join(__dirname, "views", "partials"));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));


// makes our app create sessions 
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: "placeholder",
  store: new MongoStore( { mongooseConnection: mongoose.connection } ),
}));
// set up passport w/ our session (creates properties & methods for "req")
app.use(passport.initialize());
app.use(passport.session());

// enables flash messages in our routes with "req.flash()"
app.use(flash());


// this function will run before every single route
// (put in what you need accessible on every page)

app.use((req, res, next) => {
  // send flash messages and current user info to each HBS file
  res.locals.messages = req.flash();

  res.locals.currentUser = req.user;

  
  // need this to trigger routers, else page will stay loading forever
  next(); 
});

// default value for title local
app.locals.title = 'Flowse';



const index = require('./routes/index');
app.use('/', index);

const authRouter = require('./routes/auth-router.js');
app.use('/', authRouter);

const geneRouter = require('./routes/generator-router.js');
app.use('/', geneRouter)

module.exports = app;