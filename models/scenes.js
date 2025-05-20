const mongoose = require("mongoose");

const propositionsSchema = mongoose.Schema({
  text: String,
  votes: Number,
});

const scenesSchema = mongoose.Schema({
  status: Boolean,
  game: String,
  sceneNumber: Number,
  text: String,
  voteWinner: String,
  propositions: propositionsSchema
});

const Scenes = mongoose.model("scenes", scenesSchema);

module.exports = Scenes;
