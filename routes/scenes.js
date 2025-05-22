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
      throw new Error("Aucun texte généré par Gemini.");
    }

    return text;
  } catch (error) {
    console.error("Erreur avec Gemini API :", error.message);
    throw error;
  }
}

// Fonction pour créer le prompt
function createPrompt(title, genre) {
  return `Écris en français le début d'une histoire interactive dans le genre ${genre}.Le texte doit faire environ 1500-1700 caractères maximum et doit se terminer par un cliffhanger, une tension ou un conflit. Le style du texte doit bien prendre en compte le ${genre} et le contenu doit s'adapter au ${title}. Le style doit être immersif et captivant. Mais tu ne dois pas proposer de choix`
;
}

//route pour envoyer les propositions à la BDD
router.post("/", (req, res) => {
  const { userId, gameId, text } = req.body;

  if (!gameId || !text || !userId) {
    return res.json({ result: false, error: "gameId et text sont requis" });
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
      res.json({ result: false, error: "Scene récupération failed" });
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
      const prompt = createPrompt(title, genre);

      return generateText(prompt).then((generatedText) => {
        if (!generatedText || generatedText.length === 0) {
          return res.json({
            result: false,
            error: "L'API n'a pas généré de texte",
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
        error: "Erreur lors de la génération de la première scène",
      });
    });
});

module.exports = router;
