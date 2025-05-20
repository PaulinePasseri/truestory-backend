const mongoose = require("mongoose");

const proposistionsSchema = mongoose.Schema({
  text: String,
  votes: Number,
});

const scenesSchema = mongoose.Schema({
  status: Boolean,
  game: String,
  sceneNumber: Number,
  text: String,
  voteWinner: String,
  propositions: proposistionsSchema
});

const Scenes = mongoose.model("scenes", scenesSchema);

module.exports = Scenes;
