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
function createFirstPrompt(title, genre, nbScene, public) {
  let prompt = `Écris le début pour les ${public} d'une histoire interactive en français dans le genre ${genre} et en prenant en compte le ${title} qui donneront le ton et la direction de l'histoire.

**Contraintes techniques :**
- Longueur : 500-700 caractères maximum
- Rythme narratif : adapte la progression de l'intrigue selon ${nbScene} scènes prévues mais ne génère qu'une seule scène
- Titre à intégrer : ${title}

**Style et ton :**
- Adopte les codes du genre ${genre} (atmosphère, vocabulaire, références)
- Style immersif et captivant, sans surcharge descriptive
- Narration à la 3e personne (le lecteur suit l'histoire, il n'est pas protagoniste)
- Assure la variété entre les générations successives
- **Début aléatoire : Commence l'histoire de manière inattendue, sans préambule classique ni description environnementale habituelle. Surprends le lecteur dès la première phrase.**

**Structure narrative :**
- Établis rapidement le contexte et les enjeux
- Termine par un cliffhanger marquant : tension, conflit, révélation ou question cruciale
- Crée un momentum qui donne envie de connaître la suite

**Important :** Ne propose AUCUN choix à la fin. L'histoire doit s'arrêter sur la tension narrative.`;

  // Ajout de la spécificité pour le public "enfant"
  if (public === "enfant") {
    prompt += `
**Adaptation public "enfant" (6 ans) :**
- Vocabulaire simple et phrases courtes.
- Thèmes et concepts adaptés à l'âge (pas de peur intense, sujets compréhensibles).
- Ambiance positive ou aventureuse, évitant la complexité ou la violence.
- Personnages attachants et enjeux clairs pour les jeunes lecteurs.`;
  }

  return prompt;
}


// Fonction pour créer le prompt pour les scènes suivantes
function createNextPrompt(text, history, remainingScenes, public) {
  let prompt = `Écris en français la suite de l'histoire interactive pour les ${public}.

**Contexte narratif :**
- Historique des scènes : ${history}
- Action choisie par les joueurs : "${text}"
- Scènes restantes : ${remainingScenes}

**Intégration de l'action :**
- Incorpore naturellement l'action "${text}" dans la continuité narrative
- Évite la répétition littérale : transforme, interprète ou développe l'idée
- Assure une transition fluide avec les événements précédents

**Contraintes techniques :**
- Longueur : 400-600 caractères maximum
- Rythme : calibre l'avancement selon les ${remainingScenes} scènes restantes mais ne génère qu'une seule scène
- Si peu de scènes restantes : accélère vers le dénouement
- Si nombreuses scènes : développe progressivement les enjeux

**Style narratif :**
- Maintiens la cohérence stylistique avec l'historique
- Style immersif et captivant, sans lourdeur descriptive
- Narration à la 3e personne (le lecteur suit l'histoire, il n'est pas protagoniste)
- **Variété des rebondissements : Propose des développements inattendus, des révélations ou des obstacles qui ne ressemblent pas aux précédents. Évite les schémas narratifs répétitifs.**
- Termine par un nouveau cliffhanger : tension, révélation ou dilemme

**Important :** Ne propose AUCUN choix. L'histoire s'arrête sur la tension narrative.`;

  // Ajout de la spécificité pour le public "enfant"
  // Note: Tu devras passer le paramètre 'public' à cette fonction aussi si tu veux qu'elle l'utilise.
  // Pour l'exemple, j'ajoute une condition générique.
  // Idéalement, 'public' devrait être un paramètre passé ou récupéré du contexte global.
  // Pour cette démo, je vais juste simuler la condition si 'public' était disponible.
  if (history.includes("enfant")) { // C'est une simulation, il faudrait que 'public' soit un vrai paramètre
    prompt += `
**Adaptation public "enfant" (6 ans) :**
- Vocabulaire simple et phrases courtes.
- Thèmes et concepts adaptés à l'âge (pas de peur intense, sujets compréhensibles).
- Ambiance positive ou aventureuse, évitant la complexité ou la violence.`;
  }

  return prompt;
}

// Fonction pour créer le prompt de la dernière scène
function createLastPrompt(text, history, public) {
  let prompt = `Écris en français la conclusion définitive de l'histoire interactive pour les ${public}.

**Contexte narratif :**
- Historique des scènes : ${history}
- Type de fin souhaitée : "${text}"

**Résolution narrative :**
- Intègre l'orientation de fin "${text}" de manière organique et narrative
- Ne reproduis pas directement le texte : interprète-le comme une direction créative
- Résous les conflits et tensions établis dans les scènes précédentes
- Assure une conclusion cohérente avec l'ensemble de l'histoire

**Contraintes techniques :**
- Longueur : 400-600 caractères maximum
- Structure : développement du climax + résolution + chute finale
- Rythme : conclusion satisfaisante sans précipitation

**Style narratif :**
- Maintiens la cohérence stylistique avec l'historique complet
- Style immersif et captivant, adapté au dénouement
- Ton approprié selon le type de fin (tragique, héroïque, mystérieux, etc.)
- Narration à la 3e personne (le lecteur suit l'histoire, il n'est pas protagoniste)
- Évite les fins abruptes : apporte une vraie conclusion

**Objectif :** Créer une fin mémorable qui donne un sentiment d'accomplissement narratif.`;

  // Ajout de la spécificité pour le public "enfant"
  // Idéalement, 'public' devrait être un paramètre passé ou récupéré du contexte global.
  if (history.includes("enfant")) { // Simulation
    prompt += `
**Adaptation public "enfant" (6 ans) :**
- Vocabulaire simple et phrases courtes.
- Thèmes et concepts adaptés à l'âge (pas de peur intense, sujets compréhensibles).
- Ambiance positive ou aventureuse pour la conclusion.`;
  }

  return prompt;
}

//Route pour récupérer toutes les scènes d'une partie
router.get("/all/:code", (req, res) => {
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

//Route pour pour générer la première scène
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
      const nbScene = game.nbScenes;
      const public = game.public;
      const prompt = createFirstPrompt(title, genre, nbScene, public);
      title, genre, nbScene, public;
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
  const { code, text, history, remainingScenes, sceneNumber } = req.body;

  if (!code || !text) {
    return res.json({ result: false, error: "Code and text required" });
  }

  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }
    const public = game.public;

    //Incrémentation du numéro de scène
    Scenes.findOne({ game: game._id }).then(() => {
      const prompt = createNextPrompt(text, history, remainingScenes, public);

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
          sceneNumber: sceneNumber,
          text: generatedText,
          voteWinner: null,
          propositions: [],
        });

        newScene.save().then((savedScene) => {
          res.json({ result: true, data: savedScene });
        });
      });
    });
  });
});

//Route pour envoyer le texte à l'API pour générer la dernière scène
router.post("/lastScene", (req, res) => {
  const { code, text, history, sceneNumber } = req.body;

  if (!code || !text) {
    return res.json({ result: false, error: "Code and text required" });
  }

  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }
    const public = game.public;

    //Incrémentation du numéro de scène
    Scenes.findOne({ game: game._id }).then(() => {
      const prompt = createLastPrompt(text, history, public);

      generateText(prompt).then((generatedText) => {
        if (!generatedText || generatedText.length === 0) {
          return res.json({
            result: false,
            error: "Api do not generate text",
          });
        }

        const newScene = new Scenes({
          game: game._id,
          status: true,
          sceneNumber: sceneNumber,
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

      console.log(game._id, typeof game._id);
      return Scenes.findOne({
        game: game._id,
        sceneNumber: Number(sceneNumber),
      });
    })
    .then((scene) => {
      if (!scene) {
        return res.json({ result: false, error: "Scene not found" });
      }

      res.json({ result: true, data: scene });
    });
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

  const user = await Users.findOne({ token });
  if (!user) {
    return res.json({ result: false, error: "User not found" });
  }

  const addProposition = await Scenes.updateOne(
    { game: game._id, sceneNumber: Number(sceneNumber) },
    { $push: { propositions: { userId: user._id, text: text, votes: 0 } } }
  );
  if (addProposition.modifiedCount === 0) {
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

//Route pour ajouter le gagnant du vote à une scène
router.put("/voteWinner/:code/:sceneNumber", async (req, res) => {
  const { code, sceneNumber } = req.params;

  //Cherche le jeu via son code
  const game = await Games.findOne({ code });
  if (!game) {
    return res.json({ result: false, error: "Game not found" });
  }

  //Cherche la scène via son numéro et l'id du jeu
  const scene = await Scenes.findOne({
    game: game._id,
    sceneNumber: Number(sceneNumber),
  });
  if (!scene) {
    return res.json({ result: false, error: "Scene not found" });
  }

  //Cherche le gagnant des votes parmi les propositions
  const winner = scene.propositions.reduce(
    (max, prop) => (prop.votes > max.votes ? prop : max),
    scene.propositions[0]
  );
  if (!winner) {
    return res.json({ result: false, error: "No winner found" });
  }

  //Cherche l'utilisateur via son userId
  const user = await Users.findOne({ _id: winner.userId });
  if (!user) return res.json({ result: false, error: "User not found" });

  //Met à jour la scène avec le pseudo du gagnant
  const updateScene = await Scenes.updateOne(
    { _id: scene._id },
    { $set: { voteWinner: user.nickname } }
  );
  if (updateScene.modifiedCount === 0) {
    return res.json({ result: false, error: "Scene not updated" });
  }
  return res.json({
    result: true,
    message: "Winner updated successfully",
  });
});

//Route pour récupérer le gagnant du vote d'une scène
router.get("/voteWinner/:code/:sceneNumber", async (req, res) => {
  const { code, sceneNumber } = req.params;

  const game = await Games.findOne({ code });
  if (!game) {
    return res.json({ result: false, error: "Game not found" });
  }

  const scene = await Scenes.findOne({
    game: game._id,
    sceneNumber: Number(sceneNumber),
  });
  if (!scene || !scene.voteWinner) {
    return res.json({ result: false, error: "Winner not yet defined" });
  }

  // Trouver la proposition gagnante
  const maxVotes = scene.propositions.reduce(
    (max, prop) => (prop.votes > max.votes ? prop : max),
    scene.propositions[0]
  );

  const winnersWithMaxVotes = scene.propositions.filter(
    (prop) => prop.votes === maxVotes.votes
  );

  const winner = winnersWithMaxVotes[0];

  const user = await Users.findOne({ _id: winner.userId });
  if (!user) return res.json({ result: false, error: "User not found" });

  return res.json({
    result: true,
    data: {
      nickname: user.nickname,
      text: winner.text,
      votes: winner.votes,
      avatar: user.avatar,
    },
  });
});

module.exports = router;
