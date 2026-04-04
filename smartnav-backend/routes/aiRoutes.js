const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Monument = require('../models/Monument'); // ✅ Correct for files inside /routes/// Adjust based on your models folder
const MainPlace = require('../models/MainPlace');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;

const buildFallbackReply = (prompt, place) => {
  const q = (prompt || '').toLowerCase();
  const placeName = place?.name || 'this place';
  const shortDescription = place?.shortDescription || place?.description || 'A historical site worth visiting.';
  const timings = place?.timings || 'Timings are not available right now.';
  const entryFee = place?.entryFee || 'Entry fee details are not available right now.';
  const history = place?.history || 'Historical notes are currently limited for this place.';
  const highlights = Array.isArray(place?.highlights) && place.highlights.length > 0
    ? place.highlights.slice(0, 4).join(', ')
    : null;

  if (q.includes('timing') || q.includes('open') || q.includes('close')) {
    return `${placeName} timings: ${timings}`;
  }

  if (q.includes('fee') || q.includes('ticket') || q.includes('price')) {
    return `${placeName} entry fee: ${entryFee}`;
  }

  if (q.includes('history') || q.includes('background')) {
    return `History of ${placeName}: ${history}`;
  }

  if (q.includes('how to reach') || q.includes('route') || q.includes('nearby')) {
    return `You are exploring ${placeName}. Open Live Map and tap Start Navigation to get the best route, distance, and travel time by Walk/Bike/Car.`;
  }

  const highlightsBlock = highlights ? `\nHighlights: ${highlights}` : '';
  return `About ${placeName}: ${shortDescription}\n\nTimings: ${timings}\nEntry Fee: ${entryFee}${highlightsBlock}`;
};

const findPlaceFromPrompt = async (prompt) => {
  const question = (prompt || '').trim().toLowerCase();
  if (!question) return null;

  const [monuments, mainPlaces] = await Promise.all([
    Monument.find({}, 'name monumentId shortDescription description history timings entryFee highlights').lean(),
    MainPlace.find({}, 'name mainPlaceId shortDescription description history timings entryFee highlights').lean()
  ]);

  const monumentMatch = monuments.find((m) => question.includes((m.name || '').toLowerCase()));
  if (monumentMatch) {
    return { ...monumentMatch, placeType: 'monument' };
  }

  const mainPlaceMatch = mainPlaces.find((p) => question.includes((p.name || '').toLowerCase()));
  if (mainPlaceMatch) {
    return { ...mainPlaceMatch, placeType: 'mainplace' };
  }

  return null;
};

router.post('/', async (req, res) => {
  const { prompt, monumentId, mainPlaceId, placeName } = req.body;

  try {
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ reply: 'Please ask a question so I can help you.' });
    }

    let context = "The user is exploring the Ajanta Caves.";
    let place = null;
    
    if (monumentId) {
      place = await Monument.findOne({ monumentId }).lean();
      if (place) {
        context = `The user is looking at ${place.name}. Details: ${place.description || place.shortDescription || 'No description available.'}`;
      }
    }

    if (!place && mainPlaceId) {
      place = await MainPlace.findOne({ mainPlaceId }).lean();
      if (place) {
        context = `The user is exploring ${place.name}. Details: ${place.description || place.shortDescription || 'No description available.'}`;
      }
    }

    if (!place && placeName) {
      const escaped = placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      place = await Monument.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } }).lean();
      if (!place) {
        place = await MainPlace.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } }).lean();
      }
      if (place) {
        context = `The user selected ${place.name}. Details: ${place.description || place.shortDescription || 'No description available.'}`;
      }
    }

    if (!place) {
      place = await findPlaceFromPrompt(prompt);
      if (place) {
        context = `The user asked about ${place.name}. Details: ${place.description || place.shortDescription || 'No description available.'}`;
      }
    }

    if (!process.env.OPENAI_API_KEY || !openai) {
      return res.json({ reply: buildFallbackReply(prompt, place) });
    }

    const response = await openai.chat.completions.create({
      model: "openrouter/auto",
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

    const aiReply = response?.choices?.[0]?.message?.content;
    res.json({ reply: aiReply || buildFallbackReply(prompt, place) });
  } catch (error) {
    console.error("🔥 AI ERROR:", error);
    let place = null;
    if (monumentId) {
      place = await Monument.findOne({ monumentId }).lean().catch(() => null);
    }
    if (!place && mainPlaceId) {
      place = await MainPlace.findOne({ mainPlaceId }).lean().catch(() => null);
    }
    if (!place && placeName) {
      const escaped = placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      place = await Monument.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } }).lean().catch(() => null);
      if (!place) {
        place = await MainPlace.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } }).lean().catch(() => null);
      }
    }
    if (!place) {
      place = await findPlaceFromPrompt(prompt).catch(() => null);
    }

    // Always return a usable answer even when upstream AI fails.
    res.json({ reply: buildFallbackReply(prompt, place) });
  }
});

module.exports = router;