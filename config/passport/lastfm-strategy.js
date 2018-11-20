const passport = require("passport");

const LastFmStrategy = require('passport-lastfm').Strategy;

const lastfmAPI = require('lastfmapi');

const lfm = new lastfmAPI({
  'api_key': process.env.LASTFM_KEY,
  'secret': process.env.LASTFM_SECRET,
})

const User = require('../../models/user-model.js');


passport.use(new LastFmStrategy({
  'api_key': process.env.LASTFM_KEY,
  'secret': process.env.LASTFM_SECRET,
  'callbackURL': "http://localhost:5000/auth/lastfm/callback"
}, function(req, sessionKey, done) {

  // Get the user info
  console.log(sessionKey);
  const {name, key} = sessionKey;

  // if existing user, select user
  User.findOne({userName: {$eq: name}})
    .then(userDoc => {

      //if no lastfm token, add one
      if(!userDoc.token.lastfmToken) {
        User.findByIdAndUpdate(userDoc._id, {$set: {"tokens.lastfmToken": key}})
          .then(userDoc => {
              return done(err, userDoc, sessionKey)
          })
          .catch(err => next(err));
      }

      //if already has token, just login
      return done(err, userDoc, sessionKey);

    })
    .catch(err => (next(err)));

  //if no user found, generate random email and create
  const randomEmail = String(name.concat(Math.floor(Math.random() * 100), "@gmail.com"));

  console.log(randomEmail);

  User.create({userName: name, email: randomEmail, tokens: { lastfmToken: key}}, 
    function(err, user) {
    
    if (err) return done(err);

      console.log(`user ${user.userName} added`);
      return done(err, user, sessionKey);
  })
    

}));

