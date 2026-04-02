const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Monument = require('../models/Monument'); // ✅ Correct for files inside /routes/// Adjust based on your models folder

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1", // ✅ NEW
});
router.post('/', async (req, res) => {
  const { prompt, monumentId } = req.body;

  try {
    let context = "The user is exploring the Ajanta Caves.";
    
    if (monumentId) {
      const monument = await Monument.findOne({ monumentId });
      if (monument) {
        context = `The user is looking at ${monument.name}. Details: ${monument.description}`;
      }
    }

  const response = await openai.chat.completions.create({
  model: "openrouter/auto", // ✅ NEW MODEL
  messages: [
    {
      role: "system",
      content: `You are a friendly Ajanta tour guide. Explain simply. Context: ${context}`
    },
    {
      role: "user",
      content: prompt
    }
  ],
});

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("🔥 AI ERROR:", error);
    if (error.code === 'insufficient_quota') {
      res.status(500).json({ reply: "AI service is temporarily unavailable due to quota limits. Please try again later or contact support." });
    } else {
      res.status(500).json({ reply: "I'm having trouble processing your request. Please try again." });
    }
  }
});

module.exports = router;