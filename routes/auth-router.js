const express = require('express');

const passport = require('passport');

const router = express.Router();

router.get("/signup", (req, res, next) => {
	res.render("auth-views/signup-form.hbs");
});

router.post("/process-signup", (req, res, next) => {
	const { userName, email, originalPassword } = req.body;


	// THIS IS WHERE WE CHECK THE PASSWORD RULES
	if(!originalPassword || originalPassword.match(/[0-9]/ === null)) {
		req.flash("error", "Password can't be blank and must contain a number");
		res.redirect('/signup')
		return;
	}

	// encrypt the sumbitted password before saving
	const encryptedPassword = bcrypt.hashSync(originalPassword, 10);

	User.create( { fullName, email, encryptedPassword } )
		.then(userDoc => {
			req.flash("success", "account successfully created");
			res.redirect("/")
		})
		.catch(err => next(err))	

})

router.post("/auth/default", (req, res, next) => {
	const { email, originalPassword } = req.body;

	// search the db for a user with that email
	User.findOne( { email: { $eq: email } } )
		.then(userDoc => {

			if(!userDoc) {
				req.flash("error", "Incorrect email. ");
				res.redirect("/login");
				return; // use return instead of a big else;
			}
			// check the password
			const { encryptedPassword } = userDoc;
			// "compareSync" will return false if originalPassword is WRONG
			if (!bcrypt.compareSync(originalPassword, encryptedPassword)) {
				//redirect to login page if pwd is FALSE

				// "req.flash()" is defined by "connect-flash"
				// (2 arguments: message type and message text)
				req.flash("error", "Incorrect password. 🌚");
				res.redirect("/login");
			}
			else {
					
				// "req.logIn" is a passport method that calls "serializeUser()"
				// (taht saves the USER ID in the session)
				req.logIn(userDoc, () => {
					req.flash("success", "Login successfull")
					res.redirect("/");
				});

			}
		})
		.catch(err => next(err));
});


router.get("/login", (req, res, next) => {
	res.render('auth-views/login-form.hbs');
})


//################################ SPOTIFY ################################

router.get("/auth/spotify", 
	passport.authenticate("spotify", {
		scope: ['user-read-email', 'user-read-private', 'user-follow-read', 'user-top-read', 'user-library-read']
	}), 
	function(req, res) {
    // The request will be redirected to spotify for authentication, so this
    // function will not be called.
  }
	);

router.get('/auth/spotify/callback/',
	passport.authenticate('spotify', { failureRedirect: '/login' }),
		(req, res) => {
			
			req.flash("success", "log in successful")
		    res.redirect("/");
	}
);

//################################ DEEZER ################################

router.get('/auth/deezer', 
	passport.authenticate("deezer", {
		scope: ['basic_access', 'email', 'manage_library']
	}));

router.get('/auth/deezer/callback', 
	passport.authenticate('deezer', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });


router.get("/logout", (req, res, next) => {
	// req.logout deletes a user's info from the session.
	req.logOut();

	req.flash("success", "Logged out successfully");
	res.redirect("/");
})

module.exports = router;