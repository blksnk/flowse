const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./user-model.js');

const historySchema = new Schema({
	userId: {type: Schema.Types.ObjectId, required: true},
	spotify: [ Object ],
	lastfm: [ Object ],
	deezer: [ Object ],
}, {
	timestamps: true,
})

const History = mongoose.model("History", historySchema);

module.exports = History;