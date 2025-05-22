var express = require("express");
var router = express.Router();

var { HfInference } = require("@huggingface/inference");

require("../models/connection");

const Scenes = require("../models/scenes");

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Fonction pour générer du texte à l'aide de l'API Hugging Face
async function generateText(prompt) {
  try {
    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
      },
    });
    // Vérification de la réponse
    if (!response) {
      throw new Error("Aucun texte généré par l'API");
    }
    return response;
  } catch (error) {
    console.error("Erreur lors de la requête à l'API Hugging Face :", error);
    throw error; // Relancer l'erreur pour qu'elle soit gérée par l'appelant
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
router.post("/firstScene", async (req, res) => {
  const { gameId, title, genre } = req.body;

  if (!gameId || !title || !genre) {
    return res.json({
      result: false,
      error: "gameId, title et genre sont requis",
    });
  }

  try {
    console.log(`Génération d'une scène pour: ${title} (${genre})`);

    const prompt = createPrompt(title, genre);
    //console.log("Prompt envoyé à l'API:", prompt);

    const generatedText = await generateText(prompt);

    if (!generatedText || generatedText.length === 0) {
      return "L'API n'a pas généré de texte";
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

    const savedScene = await firstScene.save();
    console.log("Scène sauvegardée avec succès:", savedScene._id);

    res.json({ result: true, data: savedScene });
  } catch (error) {
    console.error("Erreur lors de la génération de la première scène:", error);
    res.json({ result: false, error: "Erreur lors de la génération" });
  }
});

module.exports = router;
