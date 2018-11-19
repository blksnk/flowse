const express = require('express');

const router = express.Router();

const spotifyAPI = require('spotify-web-api-node');

const spotify = new spotifyAPI({
	clientID: "2a2016384e4643778797698a67984cfe",
    clientSecret: "c0ba306d26a547988d402a3d04a8b21c",
    redirectURL: "http://localhost:5000/generate/result",
});

const deezerAPI = require('node-deezer');
const deezer = new deezerAPI({
	clientID: "312144",
    clientSecret: "e03b0cb702bb560aa3a4d42651253b68",
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
	const {spotifyToken, lastfmToken, soundcloudToken, deezerToken} = req.user.tokens;

	let topGenres = [];
	let artistNames = [];

	//####################################### DEEZER ###########################
	if(spotifyToken) {
		spotify.setAccessToken(spotifyToken);

	// get top genres
	spotify.getMyTopArtists({limit: 20})
		.then(artistDoc => {
			const topArtists = artistDoc.body.items;

			// get genres of top artists
			

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
			const first5 = sortedGenres.slice(0, 1);

			genreList = first5.reduce( (sum, genre) => {
				return sum + " " + genre;
			})

			

			console.log(genreList);

			spotify.searchTracks(genreList, {limit: 5})
				.then(result => {

					res.locals.spotifyResults = result.body.tracks.items;
					// res.send(result);
					res.render('generator-views/result.hbs');
				})
				.catch(err => next(err))

			
		})
		.catch(err => next(err));
	}

	//####################################### DEEZER ###########################
	// if (deezerToken) {
	// 	console.log(deezerToken);
	// 	deezer.request(deezerToken, {
	// 		resource: 'user/recommandations/tracks',
	// 		method: 'GET',
	// 	}, (result) => {
	// 		console.log(result);
	// 		res.send(result);
	// 	}
	// )};


	//generate results

	

})







module.exports = router;