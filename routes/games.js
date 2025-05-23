var express = require("express");
var router = express.Router();

const Games = require("../models/games");
const User = require("../models/users");
const uid2 = require("uid2");

// Route création de partie
router.post("/create/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (!user) {
      return res.json({ result: false, error: "Invalid token" });
    }

    const userId = user._id;
    const newGames = new Games({
      status: true, // true si la partie est en cours
      code: uid2(5),
      title: req.body.title,
      image: req.body.image,
      nbPlayers: req.body.nbPlayers,
      nbScenes: req.body.nbScenes,
      genre: req.body.genre,
      winner: null,
      usersId: [userId], // Ajout de l'utilisateur créateur de la partie
    });
  
    newGames.save().then((newDoc) => {
      res.json({
        result: true,
        code: newDoc.code,
        title: newDoc.title,
        genre: newDoc.genre,
      });
    });
  });
});

// Récupération des informations de la partie
router.get("/game/:code", (req, res) => {
  Games.findOne({ code: req.params.code }).then((game) => {
    if (game) {
      res.json({result: true, game });
    } else {
      res.json({ result: false, error: "Game not found" });
    }
  });
});

// Ajout d'un joueur à une partie
router.post("/join", (req, res) => {
  const { code, token } = req.body;

  User.findOne({ token }).then((user) => {
    if (!user) {
      return res.json({ result: false, error: "Invalid token" });
    }

    const userId = user._id;

    Games.findOne({ code })
      .populate("usersId")
      .then((game) => {
        if (!game) {
          return res.json({ result: false, error: "Game not found" });
        }

        if (game.usersId.length >= game.nbPlayers) {
          return res.json({ result: false, error: "Game is full" });
        }

        if (game.usersId.some((u) => u._id.equals(userId))) {
          return res.json({ result: false, error: "User already in game" });
        }

        Games.updateOne({ code }, { $push: { usersId: userId } }).then(() => {
          res.json({ result: true, message: `User added to game`, game });
        });
      });
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

// Route de récupération des parties d'un utilisateur via le token
router.get("/user/:token", (req, res) => {
  Games.find()
    .populate("usersId")
    .then((games) => {
      const userGames = games.filter((game) => {
        return game.usersId.some((user) => user.token === req.params.token);
      });
      res.json({ result: true, games: userGames });
    });
});

//Ajout d'un gagnant à la partie 
router.put('/winner/:token/:code', (req, res) => {
  const { token, code } = req.params
  Games.updateOne({ code }, { winner: token })
  .then(game => {
    if (!game) {
      res.json({ result: false, error: 'Game not found'})
    } else {
      res.json({ result: true, game })
    }
  })
})

module.exports = router;
