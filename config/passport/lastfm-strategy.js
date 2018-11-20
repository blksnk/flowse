const passport = require("passport");

const LastFmStrategy = require('passport-lastfm').Strategy;

const lastfmAPI = require('lastfmapi');

const lfm = new lastfmAPI({
  'api_key': process.env.LASTFM_KEY,
  'secret': process.env.LASTFM_SECRET,
})

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

  User.create({userName: name, email: "example@email.com", tokens: { lastfmToken: key}}, 
    function(err, user) {
    
    if (err) return done(err);

      console.log(`user ${user.userName} added`);
      return done(err, user, sessionKey);
  })
    

}));






