const express = require("express");
const router = express.Router();
const { generateVoice } = require("../models/exports");

// Route POST : /exports/generate
router.post("/generate", async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).send("Texte requis");

  try {
    const audioStream = await generateVoice(text);
    res.set({ "Content-Type": "audio/mpeg" });
    audioStream.pipe(res);
  } catch (err) {
    console.error("Erreur ElevenLabs :", err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;