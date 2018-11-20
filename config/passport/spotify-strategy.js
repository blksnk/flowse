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
        User.findOne( {email: { $eq: profile._json.email } } )
          .then(userDoc => {
            if(userDoc) {

              if (userDoc.tokens.spotifyToken)

              // if user has account, refresh his access token
              // spotify.setAccessToken(userDoc.tokens.spotifyToken);
              // spotify.setRefreshToken(userDoc.tokens.spotifyRefresh);
              // console.log("refreshing token")
              // spotify.refreshAccessToken()
              //   .then(data => {
              //     const newToken = data.body['access_token'];
                  
              //     spotifyApi.setAccessToken(newToken);
                  
              //     User.findByIdAndUpdate(userDoc._id, {$set: {tokens: {spotifyToken: newToken}}})
              //     .then(doc => {
              //       console.log("TOKEN REFRESH, new token: ", newToken);

                return done(null, userDoc);
              //     })
              //     .catch(err => done(err));
              //   })
              //   .catch(err => done(err));

              // console.log("user login")
              // return done(null, userDoc);
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
          })
          .catch(err => done(err));
      })
      
        
}));

        



        
    