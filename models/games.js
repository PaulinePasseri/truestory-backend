const mongoose = require("mongoose");

const gamesSchema = mongoose.Schema({
 status: Boolean,
 code: String,
 title: String,
 image: String,
 genre: String,
 nbPlayers: Number,
 nbScenes: Number,
 winner: String,
 usersId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
});

const Games = mongoose.model("games", gamesSchema);

module.exports = Games;