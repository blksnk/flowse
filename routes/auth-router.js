const express = require('express');

const passport = require('passport');

const router = express.Router();

const User = require('../models/user-model.js');

const bcrypt = require('bcrypt');

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
	const password = bcrypt.hashSync(originalPassword, 10);

	User.create( { fullName, email, password } )
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
			const { password } = userDoc;
			// "compareSync" will return false if originalPassword is WRONG
			if (!bcrypt.compareSync(originalPassword, password)) {
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
			if (!req.user.password) {
				req.flash("success", "log in successful, please input your password")
			    res.redirect("/account/modify");
			}
			else {
				req.flash("success", "log in successfull");
				res.redirect("/");
			}
	}
);


////LASTFM
router.get('/auth/lastfm', passport.authenticate('lastfm'));

router.get('/auth/lastfm/callback', function(req, res, next){
  passport.authenticate('lastfm', {failureRedirect:'/login'}, function(err, user, sesh){
		
    res.redirect('/');
  })
});


//################################ DEEZER ################################

router.get('/auth/deezer', 
	passport.authenticate("deezer", {
		scope: ['basic_access', 'email', 'manage_library', 'offline_access']
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



//########################## ACCOUNT MANAGEMENT ###########################

router.get('/account', (req, res, next) => {
	if(!req.user) {
		req.flash("error", "Please login to manage your account.")
		res.redirect('/login');
		return;
	}
	res.render('auth-views/account-overview.hbs');
})


router.get('/account/modify', (req, res, next) => {
	if(!req.user) {
		req.flash("error", "Please login to manage your account.")
		res.redirect('/login');
		return;
	}
	res.render('auth-views/account-modify.hbs');
})

router.get('/account/services', (req, res, next) => {
	res.render('auth-views/account-services.hbs');
})

router.post('/account/modify/process-changes', (req, res, next) => {
	const {userName, email, originalPassword, newPassword } = req.body;
	const userEmail = req.user.email;

	if(!req.user) {
		req.flash("error", "Please login to manage your account.")
		res.redirect('/login');
		return;
	}
	console.log("user: ", req.user);
	//find user in DB
	User.findOne({email: userEmail  } )
		.then(userDoc => {


			// if user has no password, skip passwodr verif process
			if(!req.user.password) {
				//encrypt new password
				const newPwd = bcrypt.hashSync(newPassword, 10);

				User.findByIdAndUpdate(userDoc._id, {$set: {userName: userName, email: email, password: newPwd} } )
					.then(userDoc => {
						req.flash("success", "account info successfully updated!");
						res.redirect('/account');
					})
					.catch(err => next(err));
				return;
			}

			//check if original password is false
			if(!bcrypt.compareSync(originalPassword, userDoc.password)) {
				req.flash('error', 'Incorrect password');
				res.redirect('/account');
				return;
			}
			//if password ok
			else {
				//encrypt new password
				const newPwd = bcrypt.hashSync(newPassword, 10);

				User.findByIdAndUpdate(userDoc._id, {$set: {userName: userName, email: email, password: newPwd} } )
					.then(userDoc => {
						req.flash("success", "account info successfully updated!");
						res.redirect('/account');
					})
					.catch(err => next(err));
			}
		})
		.catch(err => {
			req.flash('error', "Internal error. Are you logged in ?")
			console.log(err);
			res.redirect('/');
		})

})

//######################### SERVICE MANAGEMENT ############################

router.post('/account/services/process-changes', (req, res, next) => {
	
})



module.exports = router;