var express = require("express");
var router = express.Router();

const Games = require("../models/games");
const uid2 = require("uid2");
const { checkBody } = require("../modules/checkBody");

// Route création de partie (avec code, titre, nb joueurs, nb scènes, genre)
router.post("/game", (req, res) => {
  if (!checkBody(req.body, ["title", "nbPlayers", "nbScenes", "genre"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  Games.findOne({
    $or: [
      { title: req.body.title },
    ],
  }).then((data) => {
    if (data === null) {
      const newGames = new Games({
        code: uid2(5),
        title: req.body.title,
        nbPlayers: req.body.nbPlayers,
        nbScenes: req.body.nbScenes,
        genre: req.body.genre,
      });

      newGames.save().then((newDoc) => {
        res.json({ result: true, code: newDoc.code });
      });
    } else {
      res.json({ result: false, error: "Game already exists" });
    }
  });
});

// Route récupération du code de la partie
router.get("/game/:gamecode", (req, res) => {
  Games.findOne({ code: req.params.gamecode }).then((data) => {
    if (data) {
      res.json({
        result: true,
        game: {
          code: data.code,
          title: data.title,
          nbPlayers: data.nbPlayers,
          nbScenes: data.nbScenes,
          genre: data.genre,
        },
      });
    } else {
      res.json({ result: false, error: "Code not found" });
    }
  });
});

// Route récupération des parties d'un utilisateur =>>>> (ne fonctonne actuellemnt pas, trouve toutes les parties)
router.get("/:user", (req, res) => {
  Games.find({ usersId: req.params.userid }).then((data) => {
    if (data) {
      res.json({
        result: true,
        games: data.map((game) => ({
          code: game.code,
          title: game.title,
          nbPlayers: game.nbPlayers,
          nbScenes: game.nbScenes,
          genre: game.genre,
        })),
      });
    } else {
      res.json({ result: false, error: "No games found" });
    }
  });
}); 

module.exports = router;
