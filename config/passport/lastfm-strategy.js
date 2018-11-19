const passport = require("passport");

const LastFmStrategy = require('passport-lastfm').Strategy;

const lastfmAPI = require('lastfmapi');
const lfm = new lastfmAPI({
  'api_key': "30925b8348549a9ab9781dbc4e4b58da",
  'secret': "98d54dde5b992abcad818aeb8f89c4ab",
})

const User = require('../../models/user-model.js');



const _ = require('lodash');

const cb_url = 'http://localhost:5000';

passport.use(new LastFmStrategy({
  'api_key': "30925b8348549a9ab9781dbc4e4b58da",
  'secret': "98d54dde5b992abcad818aeb8f89c4ab",
  'callbackURL': "http://localhost:5000/auth/lastfm/callback"
}, function(req, sessionKey, done) {

  // Get the user info
  lfm.user.getInfo(sessionKey.api_key, function (err, info) {
  console.log("INFO: ", info)
  done(null, info);
  })

  // Create the user in the database
  User.create({  })
  .then(
    req.login()
  )
  .catch();

}));

