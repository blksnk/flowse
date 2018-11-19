const passport = require("passport");

const LastFmStrategy = require('passport-lastfm').Strategy;

const User = require('../../models/user-model.js');

const _ = require('lodash');

const cb_url = 'http://localhost:5000';

passport.use(new LastFmStrategy({
  'api_key': "30925b8348549a9ab9781dbc4e4b58da",
  'secret': "98d54dde5b992abcad818aeb8f89c4ab",
  'callbackURL': "http://localhost:5000/auth/lastfm/callback"
}, function(req, sessionKey, done) {
  // Find/Update user's lastfm session
  User.create({  })
  .then()
  .catch();

  
  console.log("RESULT", sessionKey);
  done(null, sessionKey);
}));
  // If user logged in
  // if (req.user){
  //   User.findById(req.user.id, (err, user) => {
  //     if (err) return done(err);

  //     var creds = _.find(req.user.tokens, {type:'lastfm'});
  //     // if creds already present
  //     if (user.lastfm && creds){
  //       req.flash('info', {msg:'Account already linked'});

  //       return done(err, user, {msg:'Account already linked'})
  //     }

  //     else{
  //       user.tokens.push({type:'lastfm', username:sessionKey.username, key:sessionKey.key });
  //       user.lastfm = sessionKey.key;

  //       user.save(function(err){
  //         if (err) return done(err);
  //         req.flash('success', {msg:"Last.fm authentication success"});
  //         return done(err, user, sessionKey);
  //       });
  //     }
  //   });
  // }
  // else{
  //   return done(null, false, {message:'Must be logged in'});
  // }
