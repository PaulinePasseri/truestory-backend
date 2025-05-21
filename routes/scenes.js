var express = require("express");
var router = express.Router();

require("../models/connection")
const Scene = require("../models/scenes");


router.post("/", (req, res) => {
  const { gameId, text } = req.body;

  if (!gameId || !text) {
    return res.json({ result: false, error: "gameId et text sont requis" });
  }

  const newScene = new Scene({
    game: gameId,
    text: text
  });

  newScene.save().then(data => {
    res.json({ result: true, data });
  }).catch(() => {
    res.json({ result: false, error: "Scene creation failed" });
  });
});
router.get("/:gameId", (req, res) => {
  Scene.find({ game: req.params.gameId }).then(data => {
    res.json({ success: true, data });
  });
});

module.exports = router;