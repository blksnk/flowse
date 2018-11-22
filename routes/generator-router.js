const express = require('express');

const router = express.Router();

const spotifyAPI = require('spotify-web-api-node');

const User = require('../models/user-model.js');

const deezerAPI = require('node-deezer');
const deezer = new deezerAPI({
	clientID: process.env.DEEZER_KEY,
    clientSecret: process.env.DEEZER_SECRET,
    redirectURL: "http://localhost:5000/generate/result",
});

function sortByFrequency(array) {
    var frequency = {};

    array.forEach(function(value) { frequency[value] = 0; });

    var uniques = array.filter(function(value) {
        return ++frequency[value] == 1;
    });

    return uniques.sort(function(a, b) {
        return frequency[b] - frequency[a];
    });
}

router.get("/generate", (req, res, next) => {
	if(!req.user) {
		req.flash('error', 'Please log in to generate custom results');
		res.redirect("/login");
		return;
	}

	const spotify = new spotifyAPI({
		clientId: process.env.SPOTIFY_KEY,
	    clientSecret: process.env.SPOTIFY_SECRET,
	    redirectUri: "http://localhost:5000/generate/result",
	});

	const {spotifyToken, spotifyRefresh, lastfmToken, soundcloudToken, deezerToken} = req.user.tokens;
	console.log(spotifyToken);
	console.log(spotifyRefresh);


	let topGenres = [];
	let artistNames = [];
	let genreList;
	let artistList; 	

	
	if(spotifyToken) {

		console.log("sp token here, refreshing 🎧");
		console.log(req.user.tokens);

		// refresh existing token
		
		spotify.setAccessToken(req.user.tokens.spotifyToken);
		spotify.setRefreshToken(req.user.tokens.spotifyRefresh);
		spotify.refreshAccessToken()
			.then(data => {
				const newToken = data.body.access_token;


				User.findByIdAndUpdate(req.user._id, {$set: {"tokens.spotifyToken": newToken}})
	        		.then(userDoc => {
	            		console.log("TOKEN REFRESH SUCCESS" );
	            		
						//use new token
	            		spotify.setAccessToken(newToken);

	            		spotify.getMyTopArtists({limit: 20, offset: Math.floor(Math.random()*5),})
							.then(artistDoc => {
								const topArtists = artistDoc.body.items;

								//Loop over each artist and push genres to array
								topArtists.forEach( (oneArtist) => {
									topGenres = topGenres.concat(oneArtist.genres);
									artistNames = artistNames.concat(oneArtist.name);
								});

								const sortedArtists = sortByFrequency(artistNames);
								const sortedGenres = sortByFrequency(topGenres);

								// res.send(sortedGenres, sortedArtists);
								// res.send(topArtists);
								// res.render("generate-result.hbs")



								// get recommandation
								const selected = sortedGenres.slice(0, 1);

								genreList = selected.reduce( (sum, genre) => {
									return sum + " " + genre;
								})

								

								console.log(genreList);

								//####################################### SPOTIFY ###########################
								spotify.searchTracks(genreList, {limit: 5})
									.then(result => {

										res.locals.spotifyResults = result.body.tracks.items;
										// res.render('generator-views/result.hbs');
										// res.send(result);
										
										//####################################### DEEZER ###########################
										if (deezerToken) {
											deezer.request(deezerToken, {
												resource: 'user/me/history',
												method: 'GET',
												fields: {
													limit: 5,
													offset: 0,
												},
											},
											function done (err, data) {
												if(err) next (err);
												const result = data.data;
												console.log(result);
												let trackList = [];
												let counter = 0;

												// res.send(result);

												result.forEach(oneResult => {
													const artistId = oneResult.artist.id;



													deezer.request(deezerToken, {
														resource: `artist/${artistId}/top`,
														method: 'GET',
														fields: {
															limit: 5,
															
														},
													}, 
													function done (err, result) {
														console.log(result.data)
														trackList.push(result.data[Math.floor(Math.random()*5)]);
														res.locals.deezerResults = trackList;
														counter++;

														if (counter === 5) {
															res.locals.deezerResults = trackList;
															res.render('generator-views/result.hbs');
															console.log(Math.floor(Math.random()*5))
															// res.send(trackList);
														}
														console.log('counter: ', counter);
													});
												})
											})}
										else {
											res.render('generator-views/result.hbs');
											return;
										}

									})
								.catch(err => next(err));
								
							})
						.catch(err => next(err));
	     			 })
	        	.catch(err => next(err));
			})
		.catch(err => {
			console.log("POOP_____________________________________", err)
			next(err)
		});
	}

	else if(deezerToken) {
		deezer.request(deezerToken, {
			resource: 'user/me/history',
			method: 'GET',
			fields: {
				limit: 5,
				offset: 0,
			},
		},
		function done (err, data) {
			if(err) next (err);

			const result = data.data;
			let trackList = [];
			let counter = 0;

			// res.send(result);

			result.forEach(oneResult => {
				const artistId = oneResult.artist.id;



				deezer.request(deezerToken, {
					resource: `artist/${artistId}/top`,
					method: 'GET',
					fields: {
						limit: 5,
						
					},
				}, 
				function done (err, result) {
					console.log(result.data)
					trackList.push(result.data[Math.floor(Math.random()*5)]);
					res.locals.deezerResults = trackList;
					counter++;

					if (counter === 5) {
						res.locals.deezerResults = trackList;
						res.render('generator-views/result.hbs');
						console.log(Math.floor(Math.random()*5))
						// res.send(trackList);
					}
					console.log('counter: ', counter);
				});
			})

			
			
			
			
			
			
		})



		// deezer.request(deezerToken, {
		// 	resource: 'search/track',
		// 	method: 'GET',
		// 	fields: {
		// 		q: genreList, 
		// 		limit: 5
		// 	},

		// },
		// function done (err, result) {
		// 	if(err) next(err);

		// 	console.log(result);
		// 	res.locals.deezerResults = result.data;
		// 	// res.send(result);
		// 	res.render('generator-views/result.hbs');
		// 	return;
											
		// })

	}


});







module.exports = router;	