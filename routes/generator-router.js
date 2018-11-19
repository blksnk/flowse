const express = require('express');

const router = express.Router();

const spotifyAPI = require('spotify-web-api-node');

const spotify = new spotifyAPI({
	clientID: process.env.SPOTIFY_KEY,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectURL: "http://localhost:5000/generate/result",
});

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
	const {spotifyToken, spotifyRefresh, lastfmToken, soundcloudToken, deezerToken} = req.user.tokens;

	let topGenres = [];
	let artistNames = [];
	let genreList;
	let artistList; 	

	
	if(spotifyToken) {
		spotify.setAccessToken(spotifyToken);
		spotify.setRefreshToken(spotifyRefresh);
		spotify.refreshAccessToken()
			.then(token => {
				spotify.setAccessToken(token);	
			})

	// get top genres
	spotify.getMyTopArtists({limit: 20})
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
						console.log(deezerToken);
						deezer.request(deezerToken, {
							resource: 'search/track',
							method: 'GET',
							fields: {
								q: genreList, 
								limit: 5
							},

						},
						function done (err, result) {
							if(err) next(err);

							console.log(result);
							res.locals.deezerResults = result.data;
							// res.send(result);
							res.render('generator-views/result.hbs');
						}
					)}
					else {
						res.render('generator-views/result.hbs');
					}

				})
				.catch(err => next(err));
			
		})
		.catch(err => next(err));
	}

	


	//generate results


})







module.exports = router;	