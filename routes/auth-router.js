const express = require('express');

const passport = require('passport');

const router = express.Router();

const User = require('../models/user-model.js');
const History = require('../models/history-model.js')

const bcrypt = require('bcrypt');

// apis for account linking
const spotifyAPI = require('spotify-web-api-node');
const spotify = new spotifyAPI({
  clientId: process.env.SPOTIFY_KEY,
  clientSecret: process.env.SPOTIFY_SECRET,
  redirectUri: "http://localhost:5000/auth/spotify/link"
});

const deezerAPI = require('node-deezer');
const deezer = new deezerAPI({
	clientID: process.env.DEEZER_KEY,
    clientSecret: process.env.DEEZER_SECRET,
    redirectURL: "http://localhost:5000/generate/result",
});

const lastfmAPI = require('lastfmapi');
const lfm = new lastfmAPI({
  'api_key': process.env.LASTFM_KEY,
  'secret': process.env.LASTFM_SECRET,
})

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

	User.create( { userName, email, password } )
		.then(userDoc => {
			req.logIn(userDoc, () => {
				req.flash("success", "account successfully created");
				res.redirect("/")
			})
		})
		.catch(err => next(err))	

})

function refreshSpotify (userDoc) {
	spotify.setAccessToken(userDoc.tokens.spotifyToken);
	spotify.setRefreshToken(userDoc.tokens.spotifyRefresh);
	spotify.refreshAccessToken()
        .then(data => {
        	console.log("refreshed token, extracting data...")
        	const oldToken = userDoc.tokens.spotifyToken;
        	const newToken = data.body['access_token'];
          
        	spotify.setAccessToken(newToken);

        	console.log("using new token, updating db")
          
        	User.findByIdAndUpdate(userDoc._id, {$set: {"tokens.spotifyToken": newToken}})
        		.then(userDoc => {
            		console.log("TOKEN REFRESH, new token: ", newToken, "\n old token: ", oldToken);
            		req.logIn(userDoc, () => {
						req.flash("success", "Login successfull")
						res.redirect("/");
					});
     			 })
        		.catch(err => console.log(err));
		})
        .catch(err => console.log(err));
}

function getRecent (user, req, res) {

	spotify.setAccessToken(user.tokens.spotifyToken);
	spotify.getMySavedTracks({limit: 50, offset: 0})
				.then(data => {
					console.log(data);
				})
				.catch(err => console.log(err))
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
				if (userDoc.tokens.spotifyToken) {
					spotify.setAccessToken(userDoc.tokens.spotifyToken);
					spotify.setRefreshToken(userDoc.tokens.spotifyRefresh);
					spotify.refreshAccessToken()
				        .then(data => {
				        	console.log("refreshed token, extracting data...")
				        	const oldToken = userDoc.tokens.spotifyToken;
				        	const newToken = data.body['access_token'];
				          
				        	spotify.setAccessToken(newToken);

				        	console.log("using new token, updating db")
				          
				        	User.findByIdAndUpdate(userDoc._id, {$set: {"tokens.spotifyToken": newToken}})
				        		.then(userDoc => {
				            		console.log("TOKEN REFRESH, new token: ", newToken, "\n old token: ", oldToken);
				            		req.logIn(userDoc, () => {
										req.flash("success", "Login successfull")
										res.redirect("/");
									});
				     			 })
				        		.catch(err => console.log(err));
						})
				        .catch(err => console.log(err));
					
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
		scope: ['user-read-email', 'user-read-recently-played', 'user-read-private', 'user-follow-read', 'user-top-read', 'user-library-read']
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

			console.log("USER ID -------------", req.user._id )

			//store users recently played tracks on login

			//check is history already exists
			History.findOne({userId: req.user._id})
				.then(historyDoc => {
					if(historyDoc) {
						spotify.setAccessToken(req.user.tokens.spotifyToken);
						spotify.getMySavedTracks({limit: 16, offset: 0})
							.then(data => {
								const result = data.body.items;
								const trackList = [];
								let counter = 0;

								result.forEach(oneResult => {
									const name = oneResult.track.name;
									const artist = oneResult.track.artists[0].name;
									const url = oneResult.track.external_urls.spotify;

									counter++;

									const track = {
										name: name,
										artist: artist,
										url: url
									}

									trackList.push(track);

									if (counter === 16) {
										History.findByIdAndUpdate(historyDoc._id, {$set: {spotify: trackList}})
										.then(historyDoc => {
												if (!req.user.password) {
													req.flash("success", "log in successful, please input your password")
												    return res.redirect("/account/modify");
												}
												else {
													req.flash("success", "log in successfull");

													return res.redirect("/");
												}
										})
										.catch(err => console.log(err))
									}
									
									
								})	
							})
							.catch(err => console.log(err))
					}
					else {
						//if no history, create new one
						History.create({userId: req.user._id})
							.then(historyDoc => {
								console.log(historyDoc)
								
								console.log('history doc created, fetching data...')
								spotify.setAccessToken(req.user.tokens.spotifyToken);
								spotify.getMySavedTracks({limit: 16, offset: 0})
									.then(data => {
										const result = data.body.items;
										const trackList = [];
										let counter = 0;

										result.forEach(oneResult => {
												const name = oneResult.track.name;
												const artist = oneResult.track.artists[0].name;
												const url = oneResult.track.external_urls.spotify;

												counter++;

												const track = {
													name: name,
													artist: artist,
													url: url
												}

												trackList.push(track);

												if (counter === 16) {
													History.findByIdAndUpdate(historyDoc._id, {$set: {spotify: trackList}})
													.then(historyDoc => {
															if (!req.user.password) {
																req.flash("success", "log in successful, please input your password")
															    return res.redirect("/account/modify");
															}
															else {
																req.flash("success", "log in successfull");

																return res.redirect("/");
															}
													})
													.catch(err => console.log(err))
												}
												
												
											})	
									})
									.catch(err => console.log(err))
							})
							.catch(err => console.log(err));
					}
				})

			
	}
);


//#################################### LASTFM #######################################
router.get('/auth/lastfm', passport.authenticate('lastfm'));

router.get('/auth/lastfm/link', (req, res, next) => {
	// res.send(req.query);

	const {token} = req.query;
	User.findByIdAndUpdate(req.user._id, {$set: {"tokens.lastfmToken": token}})
	 	.then(userDoc => {
 			req.flash('success', 'Deezer account link successful');
 			res.redirect('/account/services')
 		})
 		.catch(err => next(err))

})

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

router.get('/auth/deezer/link', (req, res, next) => {

	const code = req.query.code;

	deezer.createSession(process.env.DEEZER_KEY_2, process.env.DEEZER_SECRET_2, code,
	 function (err, result) {
	 	if (err) next(err);

	 	// res.send({token: result.accessToken})

	 	User.findByIdAndUpdate(req.user._id, {$set: {"tokens.deezerToken": result.accessToken}})
	 		.then(userDoc => {
	 			req.flash('success', 'Deezer account link successful');
	 			res.redirect('/account/services')
	 		})
	 		.catch(err => next(err))
	 })
	
})


router.get('/auth/deezer', 
	passport.authenticate("deezer", {
		scope: ['basic_access','listening_history' , 'email', 'manage_library', 'offline_access']
	}));


router.get('/auth/deezer/callback', 
	passport.authenticate('deezer', { failureRedirect: '/login' }),
  function(req, res) {

  	if (!req.user.password) {
				req.flash("success", "log in successful, please input your password")
			    res.redirect("/account/modify");
			}
	else {
    // Successful authentication, redirect home.
		res.redirect('/');
	}

	History.create({userId: req.user._id})
		.then(historyDoc => {
			console.log(historyDoc)
			console.log('history doc created, fetching data...')

			deezer.request(req.user.tokens.deezerToken, {
				resource: 'user/me/history',
				method: 'GET',
				fields: {
					limit: 16,
				},
			},
			function done (err, data) {
				if (err) console.log(err);

				const result = data.data;

				result.forEach(oneResult => {
					const name = oneResult.title;
					const artist = oneResult.artist.name;
					const url = oneResult.link;

					const track = {
						name: name,
						artist: artist,
						url: url
					};

					console.log(track);

					History.findByIdAndUpdate(historyDoc._id, {$push: {deezer: track}})
						.then(historyDoc => {
							console.log("pushed: ", track)
						})
						.catch(err => console.log(err))
				})
			});
		})
		.catch(err => console.log(err))
	console.log(req.user.tokens.deezerToken);
	
    
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



router.post('/account/modify/process-changes', (req, res, next) => {
	const {userName, email, originalPassword, newPassword, description } = req.body;
	const userEmail = req.user.email;

	if(!req.user) {
		req.flash("error", "Please login to manage your account.")
		res.redirect('/login');
		return;
	}

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

				User.findByIdAndUpdate(userDoc._id, {$set: {userName: userName, email: email, password: newPwd, description: description} } )
					.then(userDoc => {
						console.log(userDoc);
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

router.get('/account/modify/confirm-delete', (req, res, next) => {
	res.render('auth-views/delete.hbs')
})

router.get('/account/modify/delete', (req, res, next) => {

	User.remove ({_id: req.user._id})
		.then(userDoc => {
			req.flash('success', 'Account deleted successfully');
			req.logOut();
			res.redirect('/')
		})
})




//######################### SERVICE MANAGEMENT ############################

router.get('/account/services', (req, res, next) => {
	res.render('auth-views/account-services.hbs');
})

router.get('/account/services/add/:platform', (req, res, next) => {
	const {platform} = req.params;

	if(platform === "spotify") {

		res.redirect(`https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_KEY}&response_type=code&redirect_uri=http://localhost:5000/auth/spotify/link&scope=user-read-email%20user-read-private%20user-follow-read%20user-top-read%20user-library-read&state=add`);
	}

	else if (platform === "deezer") {
		res.redirect(`https://connect.deezer.com/oauth/auth.php?perms=basic_access%2Clistening_history%2Cemail%2Cmanage_library%2Coffline_access&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fauth%2Fdeezer%2Flink&scope=basic_access%2Clistening_history%2Cemail%2Cmanage_library%2Coffline_access&client_id=${process.env.DEEZER_KEY_2}`)
	}
	else if (platform === "lastfm") {
		res.redirect(`http://www.last.fm/api/auth?api_key=${process.env.LASTFM_KEY}&cb=http%3A%2F%2Flocalhost%3A5000%2Fauth%2Flastfm%2Flink`)
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