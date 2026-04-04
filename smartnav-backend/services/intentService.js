const ROUTE_KEYWORDS = ["route", "how to go", "how to reach", "reach", "directions", "go to", "travel to", "way to"];
const NEARBY_KEYWORDS = ["nearby", "near me", "around me", "tourist places", "places nearby", "what to visit"];
const COST_KEYWORDS = ["budget", "cost", "cheap", "cheapest", "price", "fare", "minimum budget"];
const TIME_KEYWORDS = ["time", "duration", "how long", "eta"];

const hasKeyword = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const extractDestination = (message) => {
  if (!message) return null;
  const lower = message.toLowerCase();

  const patterns = [
    /(?:route to|go to|reach|how to reach|directions to|travel to)\s+(.+)/i,
    /(?:to)\s+([a-zA-Z0-9\s'\-]+)/i
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/[?.!,]+$/g, "").trim();
      if (cleaned.length > 1) return cleaned;
    }
  }

  return null;
};

const detectIntents = (message) => {
  const text = (message || "").toLowerCase();

  const intents = {
    route: hasKeyword(text, ROUTE_KEYWORDS),
    nearby: hasKeyword(text, NEARBY_KEYWORDS),
    cost: hasKeyword(text, COST_KEYWORDS),
    time: hasKeyword(text, TIME_KEYWORDS)
  };

  if (!intents.route && !intents.nearby && !intents.cost && !intents.time) {
    intents.general = true;
  }

  return intents;
};

module.exports = {
  detectIntents,
  extractDestination
};
