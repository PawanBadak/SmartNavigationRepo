const OpenAI = require("openai");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1"
    })
  : null;

const SYSTEM_PROMPT = "You are an AI travel assistant that helps tourists with navigation, cost estimation, and recommendations";

const buildContextPrompt = ({ message, userLocation, intents, directions, nearbyPlaces, estimatedCost }) => {
  const lines = [
    `User message: ${message}`,
    `Detected intents: ${Object.entries(intents)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
      .join(", ") || "general"}`
  ];

  if (userLocation && typeof userLocation.latitude === "number" && typeof userLocation.longitude === "number") {
    lines.push(`User location: lat ${userLocation.latitude}, lng ${userLocation.longitude}`);
  }

  if (directions) {
    lines.push(`Route distance: ${directions.distance || "N/A"}`);
    lines.push(`Route duration: ${directions.duration || "N/A"}`);
    lines.push(`Route summary: ${directions.routeSummary || "N/A"}`);
  }

  if (estimatedCost?.value) {
    lines.push(`Estimated travel cost: ${estimatedCost.value}`);
    lines.push(`Transport suggestions: ${estimatedCost.suggestions.join(" | ")}`);
  }

  if (nearbyPlaces?.length) {
    lines.push(
      `Nearby places: ${nearbyPlaces
        .map((p) => `${p.name} (${p.description})`)
        .join("; ")}`
    );
  }

  lines.push("Answer briefly, practical, and tourist-friendly.");
  return lines.join("\n");
};

const generateReply = async (payload) => {
  if (!openai) return null;

  const prompt = buildContextPrompt(payload);

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "openrouter/auto",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]
  });

  return completion?.choices?.[0]?.message?.content || null;
};

const buildFallbackReply = ({ message, directions, nearbyPlaces, estimatedCost }) => {
  const text = (message || "").toLowerCase();

  if (directions) {
    return `Best route found: ${directions.routeSummary}. Distance is ${directions.distance}, estimated time is ${directions.duration}.${estimatedCost?.value ? ` Approx cost: ${estimatedCost.value}.` : ""}`;
  }

  if (text.includes("nearby") && nearbyPlaces?.length) {
    return `Here are nearby places: ${nearbyPlaces.map((p) => p.name).join(", ")}.`;
  }

  if (estimatedCost?.value) {
    return `Estimated travel cost is ${estimatedCost.value}. Suggested options: ${estimatedCost.suggestions.join("; ")}.`;
  }

  return "I can help with routes, nearby places, budget estimates, and travel recommendations. Share your location and destination for a precise answer.";
};

module.exports = {
  generateReply,
  buildFallbackReply
};
