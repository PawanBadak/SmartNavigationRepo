/**
 * 🤖 AI Service Module
 * 
 * AI reasoning layer that combines:
 * - Intent detection (NLP)
 * - Cost optimization (algorithm)
 * - Recommendations (geospatial data)
 * - OpenAI reasoning (LLM synthesis)
 * 
 * This is the "trained brain" that orchestrates all services.
 */

const OpenAI = require("openai");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1"
    })
  : null;

/**
 * Generates AI response using hybrid approach:
 * 1. Uses detected intent to shape reasoning
 * 2. Includes real data (cost, recommendations)
 * 3. AI synthesizes intelligent response
 * 
 * @param {Object} payload - Orchestrated data
 * @param {string} payload.userMessage - Original user message
 * @param {string} payload.intent - Detected intent
 * @param {string} payload.destination - Extracted destination
 * @param {Object} payload.costData - Cost optimization results
 * @param {Array} payload.nearbyPlaces - Nearby attractions
 * @param {Object} payload.userLocation - User coordinates
 * @returns {Promise<string>} AI-generated response
 */
async function generateResponse(payload) {
  const {
    userMessage,
    intent,
    destination,
    costData,
    nearbyPlaces,
    userLocation,
    directions
  } = payload;

  // Build context prompt with all collected intelligence
  const contextLines = [
    `User Intent: ${intent}`,
    `User Query: "${userMessage}"`,
    userLocation ? `User Location: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : null,
    destination ? `Destination: ${destination}` : null,
    directions ? `Route Distance: ${directions.distance}, Duration: ${directions.duration}` : null,
    costData ? `Cost Optimization: ${costData.summary}` : null,
    nearbyPlaces?.length ? `Nearby Attractions (${nearbyPlaces.length}): ${nearbyPlaces.map((p) => p.name).join(", ")}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are an AI travel assistant for tourists. Your role:
1. Answer travel queries intelligently
2. Provide practical recommendations
3. Consider budget, safety, and experience
4. Use provided real-time data to enhance responses
5. Be concise, friendly, and helpful

Available data from our systems:
${contextLines}

Answer briefly (2-3 sentences max) and stay relevant to the user's intent.`;

  if (!openai) {
    return buildFallbackResponse(payload);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "openrouter/free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return completion?.choices?.[0]?.message?.content || buildFallbackResponse(payload);
  } catch (error) {
    console.error("AI Service error:", error.message);
    return buildFallbackResponse(payload);
  }
}

/**
 * Builds intelligent fallback response when AI is unavailable
 * Uses collected data to provide smart answers without LLM
 */
function buildFallbackResponse(payload) {
  const { intent, destination, costData, nearbyPlaces, directions } = payload;

  switch (intent) {
    case "ROUTE":
      if (directions) {
        return `To reach ${destination}: ${directions.distance}, estimated ${directions.duration}. Use Live Map for detailed navigation.`;
      }
      return `I can help you reach ${destination}. Try using the Live Map feature with your location for turn-by-turn directions.`;

    case "COST":
      if (costData) {
        return `For ${costData.distance}: ${costData.summary} Choose based on comfort vs budget!`;
      }
      return "Share your distance and I'll calculate the best budget travel option for you.";

    case "NEARBY":
      if (nearbyPlaces?.length) {
        return `Near you: ${nearbyPlaces
          .slice(0, 3)
          .map((p) => `${p.name} (${p.category})`)
          .join(", ")}. Enable location for more!`;
      }
      return "Enable location permissions to discover nearby tourist places and attractions.";

    case "EMERGENCY":
      return "For emergencies: Police (100), Ambulance (102), Tourist Help (1363). Stay safe!";

    default:
      return "Ask me about routes, nearby places, budget options, or travel tips!";
  }
}

/**
 * Validates if we should call AI or use fallback
 * @returns {boolean} Whether AI is available and configured
 */
function isAIAvailable() {
  return !!openai && !!process.env.OPENAI_API_KEY;
}

module.exports = {
  generateResponse,
  buildFallbackResponse,
  isAIAvailable
};
