const passport = require('passport');

const SpotifyStrategy = require('passport-spotify').Strategy;

const spotifyAPI = require('spotify-web-api-node');
const spotify = new spotifyAPI({
  clientID: "2a2016384e4643778797698a67984cfe",
    clientSecret: "c0ba306d26a547988d402a3d04a8b21c",
    
});

const User = require('../../models/user-model.js')
 
passport.use(
  new SpotifyStrategy(
    {
      clientID: "2a2016384e4643778797698a67984cfe",
      clientSecret: "c0ba306d26a547988d402a3d04a8b21c",
      callbackURL: 'http://localhost:5000/auth/spotify/callback'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      process.nextTick( () => {
        User.findOne( {email: { $eq: profile._json.email } } )
          .then(userDoc => {
            if(userDoc) {
              // if user has account, refresh his access token
              spotify.setAccessToken(userDoc.tokens.spotifyToken);
              spotify.setRefreshToken(userDoc.tokens.spotifyRefresh);
              spotify.refreshAccessToken()
                .then(data => {
                    const newToken = data.body['access_token'];

                    User.findByIdAndUpdate(userDoc._id, {$set: {tokens: {spotifyToken: newToken}}})
                    .then(doc => {
                      console.log("TOKEN REFRESH, new token: ", newToken);
                      return;
                    })
                    .catch(err => next(err));
                })
                .catch(err => next(err))

              console.log("user login")
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
            
          })
          .catch(err => done(err));
        
      })

        
}));

        



        
    