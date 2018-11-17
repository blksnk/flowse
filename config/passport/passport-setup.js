const passport = require('passport');

const User = require('../../models/user-model.js');

// selerializeUser defines what data to save in the session
// (happens when you log in successfully)
passport.serializeUser( (userDoc, done) => {
	console.log("SERIALIZE saving user ID to session 🐡")
	// call "done()" with null and the result if it's successful
	// (the result is the user's ID that we want to save in the session) 
	done(null, userDoc._id);
});


// deserialiezUser defins how to retrieve the user information from the DB
// (happens automatically on EVERY req AFTER you log in)
passport.deserializeUser( (userId, done) => {
	console.log("DESERIALIZE retrieving user info from the DB 🦖")
	

	User.findById(userId)
		.then(userDoc => {
			// call "done()" with null and the result if it's successful
			// (the result is the user document from the database) 
			done(null, userDoc)
		})
		// call done() w/ the error object if it fails
		.catch(err => done(err))
});