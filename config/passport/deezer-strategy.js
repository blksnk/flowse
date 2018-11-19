const passport = require('passport');

const DeezerStrategy = require('passport-deezer').Strategy;

const User = require('../../models/user-model.js');

passport.use(new DeezerStrategy({
    clientID: process.env.DEEZER_KEY,
    clientSecret: process.env.DEEZER_SECRET,
    callbackURL: "http://localhost:5000/auth/deezer/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile, accessToken);
    //check for existing user
    User.findOne({email: {$eq: profile._json.email} } )
    	.then(userDoc => {
    		if (userDoc) {

    			//check if no deezer token
    			if(!userDoc.tokens.deezerToken) {

    				// add deezer token to existing account
    				User.findByIdAndUpdate(userDoc._id, {$set: {tokens: {deezerToken: accessToken, deezerRefresh: refreshToken} } } )
		    			.then(userDoc => {
		    				console.log("DEEZER TOKEN ADDED");

		    				done(null, userDoc);
		    				return;
		    			})
		    			.catch(err => done(err));
		    		return;
	    			}

	    		else {
	    			return done(null, userDoc);
	    		}

    			
    		}
    		// if no user found, create one
    			User.create({ userName : profile._json.name, email: profile._json.email, tokens: {deezerToken: accessToken , deezerRefresh: refreshToken} })
	    		.then(userDoc => {
	        	// call done with null when the result is successful
	        	// (the result is the user document from the database)
		        console.log("user CREATE")
		        return done(null, userDoc);
	      		})
	     		// call done with the error object if it fails
	      		.catch(err => done(err));
    		})
    		

    	}));



    

