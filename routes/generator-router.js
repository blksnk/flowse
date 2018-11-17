const express = require('express');

const router = express.Router();

const spotifyAPI = require('spotify-web-api-node');
const spotify = new spotifyAPI({
	clientID: "2a2016384e4643778797698a67984cfe",
    clientSecret: "c0ba306d26a547988d402a3d04a8b21c",
    redirectURL: "http://localhost:5000/generate/result",
});

router.get("/generate", (req, res, next) => {
	const {spotifyToken, lastfmToken, soundcloudToken} = req.user.tokens;

	if(spotifyToken && !lastfmToken && !soundcloudToken) {
		res.redirect('/generate/sp');
	}
	else if (!spotifyToken && lastfmToken && !soundcloudToken) {
		res.redirect('/generate/lf')
	}
	else if (!spotifyToken && !lastfmToken && soundcloudToken) {
		res.redirect('/generate/sc')
	}
	else if (spotifyToken && lastfmToken && !soundcloudToken) {
		res.redirect('/generate/sp-lf');
	}
	else if (!spotifyToken && lastfmToken && soundcloudToken) {
		res.redirect('/generate/sc-lf')
	}
	else if (spotifyToken && !lastfmToken && soundcloudToken) {
		res.redirect('/generate/sp-sc')
	}
	else if (spotifyToken && lastfmToken && soundcloudToken) {
		res.redirect('/generate/sp-sc-lf')
	}
})

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

router.get("/generate/sp", (req, res, next) => {
	const {spotifyToken} = req.user.tokens;
	spotify.setAccessToken(spotifyToken);

	// get top genres
	spotify.getMyTopArtists({limit: 20})
		.then(artistDoc => {
			const topArtists = artistDoc.body.items;

			// get genres of top artists
			let topGenres = [];
			let artistNames = [];

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
			const first5 = sortedGenres.slice(0, 4);

			const genreList = first5.reduce( (sum, genre) => {
				return sum + " " + genre;
			})

			console.log(genreList);

			
			spotify.getRecommendations({seed_genres: genreList, limit: 5})
				.then(recommandation => {
					res.send(recommandation);
				})
		})
		.catch(err => next(err));
})




module.exports = router;