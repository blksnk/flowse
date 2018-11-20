const passport = require('passport');

const SpotifyStrategy = require('passport-spotify').Strategy;

//refresh access token
const spotifyAPI = require('spotify-web-api-node');
const spotify = new spotifyAPI({
  clientID: process.env.SPOTIFY_KEY,
    clientSecret: process.env.SPOTIFY_SECRET,
    
});

const User = require('../../models/user-model.js')

//login and signup
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_KEY,
      clientSecret: process.env.SPOTIFY_SECRET,
      callbackURL: 'http://localhost:5000/auth/spotify/callback'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      process.nextTick( () => {

        //login and signup
        User.findOne( {email: { $eq: profile._json.email } } )
          .then(userDoc => {
            if(userDoc) {

              if (!userDoc.tokens.spotifyToken) {
                User.findOneAndUpdate(userDoc._id, {$set: {tokens: {spotifyToken: accessToken, spotifyRefresh: refreshToken}}})
                  .then(userDoc => {
                    console.log("success", 'Spotify account linked')
                    done(null, userDoc);
                    return;
                  })
                  .catch(err => done(err))
              }

              // if user has account, refresh his access token
              if(userDoc.tokens.spotifyToken) {
                  return done(null, userDoc);
              }

              User.create({ userName : profile.id, email: profile._json.email, tokens: {spotifyToken: accessToken , spotifyRefresh: refreshToken} })
                .then(userDoc => {
                  // call done with null when the result is successful
                  // (the result is the user document from the database)
                  console.log("user CREATE")
                  return done(null, userDoc);
                })
                // call done with the error object if it fails
                .catch(err => done(err));   
            }      
          })
          .catch(err => done(err));
      })
      
        
}));

        



        
    