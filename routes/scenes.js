var express = require("express");
var router = express.Router();

var { HfInference } = require("@huggingface/inference");

require("../models/connection");

const Scenes = require("../models/scenes");
const Games = require("../models/games");

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Fonction pour générer du texte à l'aide de l'API Hugging Face
async function generateText(prompt) {
  try {
    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-v0.1", // 
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
      },
    });
    if (!response || !response.generated_text) {
      throw new Error("Aucun texte généré par l'API");
    }
    return response.generated_text;
  } catch (error) {
    console.error("Erreur lors de la requête à l'API Hugging Face :", error);
    throw error;
  }
}

// Fonction pour créer le prompt
function createPrompt(title, genre) {
  return `Écris en français le début d'une histoire interactive dans le genre ${genre} avec le titre "${title}". 
  Le texte doit faire environ 1500-2000 caractères maximum et doit se terminer par une situation où le lecteur doit faire un choix.
  Le style doit être immersif et captivant.`;
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
  Games.findOne({ code: code }).then((game) => {
    if (game) {
      const gameId = game._id;
      const title = game.title;
      const genre = game.genre;
      const prompt = createPrompt(title, genre);

      const generatedText = generateText(prompt);
      generatedText.then((data) =>{
        if (!data || data.length === 0) {
          return "L'API n'a pas généré de texte";
        }
  
        console.log("Texte généré:", data);
  
        const firstScene = new Scenes({
          game: gameId,
          status: false,
          sceneNumber: 1,
          voteWinner: null,
          propositions: [],
          text: data,
        });
  
        firstScene.save().then((data) => {
          res.json({ result: true, data });
        });
      })
  
    }
  });
});

module.exports = router;
