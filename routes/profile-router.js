const express = require("express");

const router = express.Router();

const User = require('../models/user-model.js');
const History = require('../models/history-model.js');

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


router.get('/me', (req, res, next) => {
	if(!req.user) {
		req.flash("error", "Please login to manage your account.")
		res.redirect('/login');
		return;
	}

	History.findOne({userId: req.user._id})
		.then(historyDoc => {
			//refresh recent tracks before displaying
			if (req.user.tokens.spotifyToken) {

				spotify.setAccessToken(req.user.tokens.spotifyToken);
					spotify.getMySavedTracks({limit: 16, offset: 0})
						.then(data => {
							const result = data.body.items;
							let trackList = []
							result.forEach(oneResult => {
								const name = oneResult.track.name;
								const artist = oneResult.track.artists[0].name;
								const url = oneResult.track.external_urls.spotify;
								const track = {
									name: name,
									artist: artist,
									url: url
								}

								trackList.push(track);
								
							})
							History.findByIdAndUpdate(historyDoc._id, {$set: {spotify: trackList}})
									.then(historyDoc => {
										console.log('pushed : ', track);	
									})
									.catch(err => console.log(err))	
						})
						.catch(err => console.log(err))
			}


			if (req.user.tokens.deezerToken) {

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

					let trackList = [];
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
						trackList.push(track);
						
					})
					History.findByIdAndUpdate(historyDoc._id, {$set: {deezer: trackList}})
							.then(historyDoc => {
								console.log("pushed: ", track)
							})
							.catch(err => console.log(err))
				});
			}
			//send info to page
			res.locals.recentSpotify = historyDoc.spotify;
			res.locals.recentDeezer = historyDoc.deezer;
			res.locals.recentLastfm = historyDoc.lastfm;
			res.render('profile-views/profile-me.hbs');
		})
		.catch(err => next(err));
	
	
})











module.exports = router;