const mongoose = require("mongoose");

const gamesSchema = mongoose.Schema({
 status: Boolean,
 code: Number,
 title: String,
 genre: String,
 nbPlayers: Number,
 nbScenes: Number,
 winner: String,
});

const Games = mongoose.model("games", gamesSchema);

module.exports = Games;