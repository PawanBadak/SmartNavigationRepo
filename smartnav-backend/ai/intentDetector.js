/**
 * 🧠 Intent Detector Module
 * 
 * NLP-based intent classification system.
 * Detects user intent without relying on LLM.
 * Provides foundational understanding of user needs.
 */

const INTENT_PATTERNS = {
  ROUTE: {
    keywords: ["route", "how to go", "how to reach", "reach", "directions", "go to", "travel to", "way to", "navigate", "path"],
    examples: ["How to reach Ajanta?", "Route to cave", "Directions please"]
  },
  NEARBY: {
    keywords: ["nearby", "near me", "around me", "tourist places", "places nearby", "what to visit", "attractions", "sites", "show me"],
    examples: ["What's nearby?", "Show attractions", "Tourist places near me"]
  },
  COST: {
    keywords: ["budget", "cost", "cheap", "cheapest", "price", "fare", "how much", "minimum budget", "affordable", "economical"],
    examples: ["What's the cheapest way?", "Budget travel options", "Cost estimate"]
  },
  EMERGENCY: {
    keywords: ["emergency", "hospital", "police", "help", "urgent", "sos", "accident", "danger"],
    examples: ["Need help!", "Where's hospital?", "Emergency contact"]
  },
  TIME: {
    keywords: ["time", "duration", "how long", "eta", "when", "minutes", "hours"],
    examples: ["How long will it take?", "ETA?", "Travel time"]
  }
};

/**
 * Detects primary user intent from message
 * @param {string} message - User input
 * @returns {string} Intent type (ROUTE, NEARBY, COST, EMERGENCY, TIME, GENERAL)
 */
function detectIntent(message) {
  if (!message || typeof message !== "string") return "GENERAL";
  
  const msg = message.toLowerCase().trim();
  
  // Check each intent type
  for (const [intentType, config] of Object.entries(INTENT_PATTERNS)) {
    if (config.keywords.some(kw => msg.includes(kw))) {
      return intentType;
    }
  }
  
  return "GENERAL";
}

/**
 * Detects all possible intents (returns multiple matches)
 * @param {string} message - User input
 * @returns {Array} Array of detected intents
 */
function detectMultipleIntents(message) {
  if (!message || typeof message !== "string") return [];
  
  const msg = message.toLowerCase();
  const detected = [];
  
  for (const [intentType, config] of Object.entries(INTENT_PATTERNS)) {
    if (config.keywords.some(kw => msg.includes(kw))) {
      detected.push(intentType);
    }
  }
  
  return detected.length > 0 ? detected : ["GENERAL"];
}

/**
 * Extracts destination name from user message
 * @param {string} message - User input
 * @returns {string|null} Extracted destination
 */
function extractDestination(message) {
  if (!message || typeof message !== "string") return null;
  
  const lower = message.toLowerCase();
  const patterns = [
    /(?:to|reach|go to|visit)\s+([a-zA-Z0-9\s'\-,]+?)(?:\?|$|\.)/i,
    /(?:route to|directions to|how to reach)\s+([a-zA-Z0-9\s'\-,]+?)(?:\?|$|\.)/i
  ];
  
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/[?.!,]+$/g, "").trim();
      if (cleaned.length > 2) return cleaned;
    }
  }
  
  return null;
}

module.exports = {
  detectIntent,
  detectMultipleIntents,
  extractDestination,
  INTENT_PATTERNS
};
