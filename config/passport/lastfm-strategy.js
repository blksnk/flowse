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

  // Create the user in the database
  console.log(sessionKey);
  User.create({ userName: sessionKey.name, email: "example@mail.com", tokens: {lastfmToken: sessionKey.key} })
  .then( userDoc => {
    lfm.user.getInfo(sessionKey.key, function (err, info) {
      console.log("INFO: ", info)
      done(null, userDoc);
    }
  )})

  .catch(err => next(err));

}));

