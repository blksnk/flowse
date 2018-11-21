const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema ({
	userName: {type: String, required: true, unique: false},
	email: {type: String, required: true, unique: true},
	description: {type: String, required: false},
	tokens: {
		spotifyToken: {type: String},
		spotifyRefresh: {type: String},
		lastfmToken: {type: String},
		souncloudToken: {type: String},
		deezerToken: {type: String},
		deezerRefresh: {type: String},
	},
	password: {type: String},
}, {
	timestamps: true
})

const User = mongoose.model("User", userSchema);


module.exports = User;