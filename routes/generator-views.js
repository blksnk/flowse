const express = require('express');

const router = express.Router();

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
	else if (§spotifyToken && lastfmToken && soundcloudToken) {
		res.redirect('/generate/sc-lf')
	}
	else if (spotifyToken && !lastfmToken && soundcloudToken) {
		res.redirect('/generate/sp-sc')
	}
	else if (spotifyToken && lastfmToken && soundcloudToken) {
		res.redirect('/generate/sp-sc-lf')
	}
})

router.get("/generate/sp", (req, res next) => {
	
})


module.exports = router;