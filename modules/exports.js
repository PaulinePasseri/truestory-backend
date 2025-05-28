const fetch = require("node-fetch");
require("dotenv").config();

async function generateVoice(text) {
  const API_KEY = process.env.ELEVEN_API_KEY;
  const VOICE_ID = process.env.VOICE_ID;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Erreur ElevenLabs : " + errorText);
  }

  return response.body; // On renvoie le flux audio
}

module.exports = { generateVoice };
