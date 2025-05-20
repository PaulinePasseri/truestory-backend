const mongoose = require("mongoose");

const propositionsSchema = mongoose.Schema({
  usersId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  text: String,
  votes: Number,
});

const scenesSchema = mongoose.Schema({
  status: Boolean,
  game: String,
  sceneNumber: Number,
  text: String,
  voteWinner: String,
  propositions: propositionsSchema,
});

const Scenes = mongoose.model("scenes", scenesSchema);

module.exports = Scenes;
