const passport = require("passport");

const LastFmStrategy = require('passport-lastfm').Strategy;

const User = require('../../models/user-model.js');

const _ = require('lodash');


passport.use(new LastFmStrategy({
  'api_key': process.env.LASTFM_KEY,
  'secret': process.env.LASTFM_SECRET,
  'callbackURL': "http://localhost:5000/auth/lastfm/callback"
}, function(req, sessionKey, done) {

  


  // Get the user info
  console.log(sessionKey);
  const {name, key} = sessionKey;

  const randomEmail = String(name.concat(Math.floor(Math.random() * 100), "@gmail.com"));

  console.log(randomEmail);

  User.create({userName: name, email: randomEmail, tokens: { lastfmToken: key}}, 
    function(err, user) {
    
    if (err) return done(err);

      console.log(`user ${user.userName} added`);
      return done(err, user, sessionKey);
  })
    

}));






