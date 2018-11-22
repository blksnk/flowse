const express = require("express");

const router = express.Router();



const spotifyAPI = require('spotify-web-api-node')
const spotify = new spotifyAPI({
	clientId: process.env.SPOTIFY_KEY,
	clientSecret: process.env.SPOTIFY_SECRET,
	 redirectUri: "http://localhost:5000/feed",
});

const User = require('../models/user-model.js');
const History = require('../models/history-model.js');



router.get("/feed", (req, res, next) => {
	// Connected with for the user's part

	const { spotifyToken, deezerToken, lastfmToken } = req.user.tokens;
	
	res.locals.spotifyToken = spotifyToken;
	res.locals.deezerToken = deezerToken;
	res.locals.lastfmToken = lastfmToken;

	// Matches
	const userId = req.user._id;

	// Find me in the database 
	History.find({userId: {$eq: userId}})
	.then(userHistory => {
		// Retrieve the array of all the tracks that I listened to
		const { spotify } = userHistory[0];
		// For each song, find the ones that matches other users listenings (and NOT mines)
		Promise.all(
		spotify.map(oneSong => {
			return History.find(
				{
					$and: [{ spotify: {$elemMatch:  {name: oneSong.name}}}, {userId : {$ne : userId}}]
				},
				{ userId: 1, "spotify.$": 1 }
				).populate("userId")
			})
			)
			.then(matches => {
				let myMatches = matches.filter(results => results.length);
				// console.log("this is my matches------------------------",songInCommon);
				// Send the array to the HBS
				res.locals.match = myMatches[0];
				// res.send(matches);
				res.render('feed.hbs');
			})
			.catch(err => {
				console.log(err);
			})	
	})
});



router.get("/profile/:userId", (req, res, next) => {
	const { userId } = req.params;
	// res.send(userId);
	User.findById(userId)
	.then(wantedUser => {
		res.locals.wantedUser = wantedUser;
		// res.send(wantedUser);
		res.render("profile-views/profile-user.hbs");
	})
	.catch(err => next(err));
})



module.exports = router;