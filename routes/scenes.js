var express = require("express");
var router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("../models/connection");
const Scenes = require("../models/scenes");
const Games = require("../models/games");

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
function createFirstPrompt(title, genre) {
  return `Écris en français le début d'une histoire interactive dans le genre ${genre}.Le texte doit faire environ 1500-1700 caractères maximum et doit se terminer par un cliffhanger, une tension, un conflit ou une interrogation. Le style du texte doit bien prendre en compte le ${genre} et le contenu doit s'adapter au ${title}. Le style doit être immersif et captivant. Mais tu ne dois pas proposer de choix`;
}

// Fonction pour créer le prompt pour les scènes suivantes
function createNextPrompt(text) {
  return `Écris en français la suite de l'histoire interactive. Le texte doit faire environ 500-700 caractères maximum et doit se terminer par un cliffhanger, une tension, un conflit ou une interrogation. Le style du texte doit bien prendre en compte le contenu précédent et le ${text} donné sans l'inclure directement. Le style doit être immersif et captivant. Mais tu ne dois pas proposer de choix`;
}

//route pour envoyer les propositions à la BDD
router.post("/", (req, res) => {
  const { userId, gameId, text } = req.body;

  if (!gameId || !text || !userId) {
    return res.json({ result: false, error: "gameId and text required" });
  }

  const newScene = new Scenes({
    user: userId,
    game: gameId,
    text: text,
  });

  newScene
    .save()
    .then((data) => {
      res.json({ result: true, data });
    })
    .catch(() => {
      res.json({ result: false, error: "Scene creation failed" });
    });
});

//route pour récupérer les propositions de la BDD
router.get("/:gameId", (req, res) => {
  Scenes.find({ game: req.params.gameId })
    .then((data) => {
      res.json({ result: true, data });
    })
    .catch(() => {
      res.json({ result: false, error: "Scene recuperation failed" });
    });
});

//route pour envoyer le titre et le genre à l'API pour générer la première scène
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

//route pour envoyer le texte à l'API pour générer la scène suivante
router.post("/nextScene", (req, res) => {
  const { code, text } = req.body;

  if (!code || !text) {
    return res.json({ result: false, error: "Code and text required" });
  }

  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Jeu non trouvé" });
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
              error: "L'API n'a pas généré de texte",
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


//route pour envoyer le texte à l'API pour générer la dernière scene
router.post("/nextScene", (req, res) => {
  const { code, text } = req.body;

  if (!code || !text) {
    return res.json({ result: false, error: "Code and text required" });
  }

  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Jeu non trouvé" });
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
              error: "L'API n'a pas généré de texte",
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

//route pour récupérer une scène
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
module.exports = router;
