const passport = require('passport');

const SpotifyStrategy = require('passport-spotify').Strategy;

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

              console.log("user login")
              return done(null, userDoc);
              
            }
            User.create({ userName : profile.id, email: profile._json.email, tokens: {spotifyToken: accessToken } })
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

        



        
    