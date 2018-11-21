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














module.exports = router;