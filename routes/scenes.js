var express = require("express");
var router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("../models/connection");
const Scenes = require("../models/scenes");
const Games = require("../models/games");
const Users = require("../models/users");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fonction pour générer du texte à l'aide de l'API Gemini
async function generateText(prompt) {
  try {
    // Utiliser le nouveau nom de modèle
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No text generate by API.");
    }

    return text;
  } catch (error) {
    console.error("Error with API :", error.message);
    throw error;
  }
}

// Fonction pour créer le prompt de la première scène
function createFirstPrompt(title, genre, nbScene) {
  return `Écris en français le début d'une histoire interactive dans le genre ${genre}.Le texte doit faire environ 800-1000 caractères maximum et doit se terminer par un cliffhanger, une tension, un conflit ou une interrogation. L'histoire avance plus ou moins vite en fonction du nombre de ${nbScene}. Le style du texte doit bien prendre en compte le ${genre} et le contenu doit s'adapter au ${title}. Le style doit être immersif et captivant sans être lourd et trop détaillé. Mais tu ne dois pas proposer de choix`;
}

// Fonction pour créer le prompt pour les scènes suivantes
function createNextPrompt(text, nbScene) {
  return `Écris en français la suite de l'histoire interactive. Le texte doit faire environ 500-700 caractères maximum et doit se terminer par un cliffhanger, une tension, un conflit ou une interrogation. Le texte doit bien prendre en compte les scènes et le ${text} donné sans l'inclure directement. L'avancement de l'histoire doit prendre en compte le ${nbScene} restante. Le style doit être immersif et captivant sans être lourd. Mais tu ne dois pas proposer de choix`;
}

// Fonction pour créer le prompt de la dernière scène
function createLastPrompt(text) {
  return `Écris en français la fin de l'histoire interactive. Le texte doit faire environ 500-700 caractères maximum et doit se terminer par la fin de l'histoire. Le texte doit bien prendre en compte les scènes précédentes et le ${text} donné sans l'inclure directement. Le style doit être immersif et captivant sans être lourd.  `;
}

//Route pour récupérer toutes les scènes d'une partie
router.get("/:code", (req, res) => {
  const { code } = req.params;
  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }
    Scenes.find({ game: game._id }).then((scenes) => {
      if (scenes.length === 0) {
        return res.json({ result: false, error: "No scenes found" });
      } else {
        return res.json({ result: true, scenes });
      }
    });
  });
});

//Route pour envoyer le titre et le genre à l'API pour générer la première scène
router.post("/firstScene", (req, res) => {
  const { code } = req.body;

  Games.findOne({ code: code })
    .then((game) => {
      if (!game) {
        return res.json({ result: false, error: "Game not found" });
      }

      const gameId = game._id;
      const title = game.title;
      const genre = game.genre;
      const prompt = createFirstPrompt(title, genre);

      return generateText(prompt).then((generatedText) => {
        if (!generatedText || generatedText.length === 0) {
          return res.json({
            result: false,
            error: "L'API do not generate text",
          });
        }

        console.log("Texte généré:", generatedText);

        const firstScene = new Scenes({
          game: gameId,
          status: false,
          sceneNumber: 1,
          voteWinner: null,
          propositions: [],
          text: generatedText,
        });

        return firstScene.save().then((savedScene) => {
          res.json({ result: true, data: savedScene });
        });
      });
    })
    .catch((error) => {
      console.error("Erreur dans /firstScene:", error);
      res.json({
        result: false,
        error: "Error while generating the first scene",
      });
    });
});

//Route pour envoyer le texte à l'API pour générer la scène suivante
router.post("/nextScene", (req, res) => {
  const { code, text } = req.body;

  if (!code || !text) {
    return res.json({ result: false, error: "Code and text required" });
  }

  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }

    //Incrémentation du numéro de scène
    Scenes.findOne({ game: game._id })
      .sort({ sceneNumber: -1 })
      .then((lastScene) => {
        const nextSceneNumber = lastScene ? lastScene.sceneNumber + 1 : 2;

        const prompt = createNextPrompt(text);

        generateText(prompt).then((generatedText) => {
          if (!generatedText || generatedText.length === 0) {
            return res.json({
              result: false,
              error: "Api do not generate text",
            });
          }

          const newScene = new Scenes({
            game: game._id,
            status: false,
            sceneNumber: nextSceneNumber,
            text: generatedText,
            voteWinner: null,
            propositions: [],
          });

          newScene
            .save()
            .then((savedScene) => {
              res.json({ result: true, data: savedScene });
            })
            .catch((err) => {
              console.error("Error", err);
              res.json({
                result: false,
                error: "Error",
              });
            });
        });
      });
  });
});

//Route pour envoyer le texte à l'API pour générer la dernière scène
router.post("/lastScene", (req, res) => {
  const { code, text } = req.body;

  if (!code || !text) {
    return res.json({ result: false, error: "Code and text required" });
  }

  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }

    //Incrémentation du numéro de scène
    Scenes.findOne({ game: game._id })
      .sort({ sceneNumber: -1 })
      .then((lastScene) => {
        const nextSceneNumber = lastScene ? lastScene.sceneNumber + 1 : 2;

        const prompt = createLastPrompt(text);

        generateText(prompt).then((generatedText) => {
          if (!generatedText || generatedText.length === 0) {
            return res.json({
              result: false,
              error: "Api do not generate text",
            });
          }

          const newScene = new Scenes({
            game: game._id,
            status: false,
            sceneNumber: nextSceneNumber,
            text: generatedText,
            voteWinner: null,
            propositions: [],
          });

          newScene
            .save()
            .then((savedScene) => {
              res.json({ result: true, data: savedScene });
            })
            .catch((err) => {
              console.error("Error", err);
              res.json({
                result: false,
                error: "Error",
              });
            });
        });
      });
  });
});

//Route pour récupérer une scène et ses propositions
router.get("/code/:code/scene/:sceneNumber", (req, res) => {
  const { code, sceneNumber } = req.params;
  console.log("PARAMS:", code, sceneNumber);

  if (!code || !sceneNumber) {
    return res.json({ result: false, error: "Code and sceneNumber required" });
  }

  Games.findOne({ code })
    .then((game) => {
      if (!game) {
        return res.json({ result: false, error: "Game not found" });
      }

      console.log(game._id, typeof(game._id))
       return Scenes.findOne({
        game: game._id,
        sceneNumber: Number(sceneNumber)
      });
    })
    .then((scene) => {
      if (!scene) {
        return res.json({ result: false, error: "Scene not found" });
      }

      res.json({ result: true, data: scene });
    })
});

//Route pour envoyer une proposition d'un joueur donné à une scène donnée
router.put("/proposition/:code/:sceneNumber/:token", async (req, res) => {
  const { code, sceneNumber, token } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.json({ result: false, error: "gameId and text required" });
  }

  const game = await Games.findOne({ code });
  if (!game) {
    return res.json({ result: false, error: "Game not found" });
  }

  const user = Users.findOne({ token });
  if (!user) {
    return res.json({ result: false, error: "User not found" });
  }

  const addProposition = await Scenes.updateOne(
    { game: game._id, sceneNumber: Number(sceneNumber) },
    { $push: { propositions: { userId: user._id, text: text, votes: 0 } } }
  );
  if (addProposition.prpopositions.length === 0) {
    return res.json({ result: false, error: "Scene not updated" });
  }
  return res.json({ result: true, message: "Scene updated successfully" });
});

//Route pour ajouter un vote à une scène
router.put("/vote/:sceneId/:propositionId", async (req, res) => {
  const { sceneId, propositionId } = req.params;
  const result = await Scenes.updateOne(
    {
      _id: sceneId,
      "propositions._id": propositionId,
    },
    {
      $inc: { "propositions.$.votes": 1 },
    }
  );

  if (result.modifiedCount === 0) {
    return res.json({
      result: false,
      error: "Proposition not found or no update made",
    });
  }

  return res.json({ result: true, message: "Vote added" });
});

module.exports = router;
