const express = require('express');

const passport = require('passport');

const router = express.Router();

const User = require('../models/user-model.js');

const bcrypt = require('bcrypt');

//redirect uri for accont linking
const spotifyAPI = require('spotify-web-api-node');
const spotify = new spotifyAPI({
  clientId: process.env.SPOTIFY_KEY,
  clientSecret: process.env.SPOTIFY_SECRET,
  redirectUri: "http://localhost:5000/auth/spotify/link"
});

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

function refreshSpotify (userDoc) {
	spotify.setAccessToken(userDoc.tokens.spotifyToken);
	spotify.setRefreshToken(userDoc.tokens.spotifyRefresh);
	spotify.refreshAccessToken()
        .then(data => {
        	const oldToken = userDoc.tokens.spotifyToken;
        	const newToken = data.body['access_token'];
          
        	spotifyApi.setAccessToken(newToken);
          
        	User.findByIdAndUpdate(userDoc._id, {$set: {"tokens.spotifyToken": newToken}})
        		.then(userDoc => {
            		console.log("TOKEN REFRESH, new token: ", newToken, "\n old token: ", oldToken);
            		req.logIn(userDoc, () => {
						req.flash("success", "Login successfull")
						res.redirect("/");
					});
     			 })
        		.catch(err => next(err));
		})
        .catch(err => next(err));
}

router.post("/auth/default", (req, res, next) => {
	const { email, originalPassword } = req.body;

	// search the db for a user with that email
	User.findOne( { email: { $eq: email } } )
		.then(userDoc => {

			if(!userDoc) {
				req.flash("error", "Incorrect email. ");
				res.redirect("/login");
				return;
			}
			// check the password
			const { password } = userDoc;
			if (!bcrypt.compareSync(originalPassword, password)) {

				//redirect to login page if pwd is FALSE
				req.flash("error", "Incorrect password. 🌚");
				res.redirect("/login");
			}
			else {
				if (req.user.tokens.spotifyToken) {
				refreshSpotify(userDoc)
					
				}
				//refresh SPOTIFY token on login...
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

router.get('/auth/spotify/link', (req, res, next) => {
	// res.send([req.query, req.user]);
	const code = req.query.code;
	console.log(req.query.code) //access token for that account

	//
	spotify.authorizationCodeGrant(code)
		.then(data => {
			console.log(data);
			console.log(req.user);
			User.findByIdAndUpdate(req.user._id, {$set: {"tokens.spotifyToken": data.body.access_token, "tokens.spotifyRefresh": data.body.refresh_token}})
  				.then(userDoc => {
		  			req.flash('success', 'Spotify account link successful');
		  			return res.redirect('/account/services');
		  			
				})
		  		
		  		.catch(err => next(err));
		})
		.catch(err => next(err));

	
})

router.get('/auth/spotify/callback',
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


//######################## LASTFM ######################
router.get('/auth/lastfm', passport.authenticate('lastfm'));

router.get('/auth/lastfm/callback', function(req, res, next){
  passport.authenticate('lastfm', {failureRedirect:'/login'}, 
  	function(err, user, sesh){
  	

  	console.log({err, user, sesh});
	req.logIn(user, function() {

		if(!req.user.password) {
			req.flash('success', 'Account successfully created, please enter valid email address and password')
		    res.redirect('/account/modify');
		    return;
		}
		
		res.redirect('/');
	});

  })(req, {} );
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
	// if(!req.user) {
	// 	req.flash("error", "Please login to manage your account.")
	// 	res.redirect('/login');
	// 	return;
	// }
	res.render('auth-views/account-modify.hbs');
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

router.get('/account/services', (req, res, next) => {
	res.render('auth-views/account-services.hbs');
})

router.get('/account/services/add/:platform', (req, res, next) => {
	const {platform} = req.params;

	if(platform === "spotify") {

		res.redirect('https://accounts.spotify.com/authorize?client_id=2a2016384e4643778797698a67984cfe&response_type=code&redirect_uri=http://localhost:5000/auth/spotify/link&scope=user-read-email%20user-read-private%20user-follow-read%20user-top-read%20user-library-read&state=add');
		// generate request url

		// var scopes = ['user-read-email', 'user-read-private', 'user-follow-read', 'user-top-read', 'user-library-read'],
		// state = "add";

		// var authorizeURL = spotify.createAuthorizeURL(scopes, state);
		// console.log(authorizeURL);

      	
	    
	}
})

router.get('/account/services/rm/:platform', (req, res, next) => {
	const {platform} = req.params;

	if(platform === "spotify") {
		User.findByIdAndUpdate(req.user._id, {$unset: {"tokens.spotifyToken": 1}})
			.then(userDoc => {
				req.flash('success', 'Spotify account unlinked');
				return res.redirect('/account/services')
			})
			.catch(err => next(err));
	}

	if(platform === "deezer") {
		User.findByIdAndUpdate(req.user._id, {$unset: {"tokens.deezerToken": 1}})
			.then(userDoc => {
				req.flash('success', 'Deezer account unlinked');
				return res.redirect('/account/services')
			})
			.catch(err => next(err));
	}

	if(platform === "lastfm") {
		User.findByIdAndUpdate(req.user._id, {$unset: {"tokens.lastfmToken": 1}})
			.then(userDoc => {
				req.flash('success', 'Spotify account unlinked');
				return res.redirect('/account/services')
			})
			.catch(err => next(err));
	}

	req.flash('error', 'No service available for deletion');
	res.redirect('/account/services');
})

module.exports = router;