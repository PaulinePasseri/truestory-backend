var express = require("express");
var router = express.Router();

const Games = require("../models/games");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Route création de partie
router.post("/create", (req, res) => {
  const newGames = new Games({
    status: true, // true si la partie est en cours
    code: uid2(5),
    title: req.body.title,
    image: req.body.image,
    nbPlayers: req.body.nbPlayers,
    nbScenes: req.body.nbScenes,
    genre: req.body.genre,
    winner: null,
    usersId: [],
  });

  newGames.save().then((newDoc) => {
    res.json({ result: true, code: newDoc.code, title: newDoc.title, genre: newDoc.genre });
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
          usersId: data.usersId,
        },
      });
    } else {
      res.json({ result: false, error: "Code not found" });
    }
  });
});

// Ajout d'un joueur à une partie
router.post("/join", (req, res) => {
  const { code, userId } = req.body;
  Games.findOne({ code }).populate('usersId').then((game) => {
    if (game) {
      if (game.usersId.length < game.nbPlayers) {
        Games.updateOne({ code }, { $push: { usersId: userId } }).then(() => {
          res.json({ result: true, message: `User added to game`, game });
        });
      } else {
        res.json({ result: false, error: "Game is full" });
      }
    } else {
      res.json({ result: false, error: "Game not found" });
    }
  });
});

// Récupération des joueurs de la partie 
router.get("/players/:gamecode", (req, res) => {
  Games.findOne({ code: req.params.gamecode })
    .populate("usersId")
    .then((data) => {
      if (data) {
        res.json({
          result: true,
          players: data.usersId.map((user) => ({
            id: user._id,
            nickname: user.nickname,
            avatar: user.avatar,
          })),
        });
      } else {
        res.json({ result: false, error: "No players found" });
      }
    });
});

// Route récupération des parties d'un utilisateur =>>>> (ne fonctonne actuellemnt pas, trouve toutes les parties)
router.get("/:user", (req, res) => {
  Games.find({ userId: req.params.userId }).then((data) => {
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
