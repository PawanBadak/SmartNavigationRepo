/**
 * 💰 Cost Optimization Engine
 * 
 * Calculates and optimizes travel costs across multiple modes.
 * Provides budget recommendations for different transport types.
 * Used for budget-conscious travel planning.
 */

const TRANSPORT_MODES = {
  bus: {
    costPerKm: 2,
    label: "Public Bus",
    emoji: "🚌",
    pros: ["Cheapest", "Popular", "Regular routes"],
    cons: ["Slow", "Crowded", "Fixed schedule"]
  },
  auto: {
    costPerKm: 8,
    label: "Auto Rickshaw",
    emoji: "🛺",
    pros: ["Affordable", "Flexible", "Local"],
    cons: ["Not metered", "No AC", "Limited luggage"]
  },
  cab: {
    costPerKm: 15,
    label: "Taxi/Cab",
    emoji: "🚕",
    pros: ["Comfortable", "Direct", "Safe"],
    cons: ["Expensive", "May surge", "App dependent"]
  },
  bike: {
    costPerKm: 1,
    label: "Bike/Cycle",
    emoji: "🚲",
    pros: ["Free/Cheap", "Eco-friendly", "Exercise"],
    cons: ["Physical", "Weather", "No luggage"]
  },
  walk: {
    costPerKm: 0,
    label: "Walk",
    emoji: "🚶",
    pros: ["Free", "Healthy", "Explore"],
    cons: ["Slow", "Tiring", "Distance limited"]
  }
};

/**
 * Parses distance string to kilometers
 * @param {string} distanceText - Distance in format "5 km", "500 m", etc.
 * @returns {number|null} Distance in kilometers
 */
function parseDistanceToKm(distanceText) {
  if (!distanceText || typeof distanceText !== "string") return null;
  
  const text = distanceText.toLowerCase().trim();
  
  const kmMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*km/);
  if (kmMatch) return Number(kmMatch[1]);
  
  const mMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*m/);
  if (mMatch) return Number(mMatch[1]) / 1000;
  
  return null;
}

/**
 * Calculates costs for all transport modes
 * @param {number} distanceKm - Distance in kilometers
 * @returns {Object} Cost breakdown for each mode
 */
function calculateCosts(distanceKm) {
  if (typeof distanceKm !== "number" || distanceKm <= 0) return null;
  
  const costs = {};
  
  for (const [mode, config] of Object.entries(TRANSPORT_MODES)) {
    const baseCost = Math.round(distanceKm * config.costPerKm);
    const minCost = mode === "walk" ? 0 : 20;
    
    costs[mode] = Math.max(minCost, baseCost);
  }
  
  return costs;
}

/**
 * Recommends cheapest transport option
 * @param {number} distanceKm - Distance in kilometers
 * @returns {Object} Recommendation with cost breakdown
 */
function recommendCheapest(distanceKm) {
  const costs = calculateCosts(distanceKm);
  if (!costs) return null;
  
  const entries = Object.entries(costs);
  const cheapest = entries.reduce(([mode1, cost1], [mode2, cost2]) => 
    cost1 < cost2 ? [mode1, cost1] : [mode2, cost2]
  );
  
  return {
    mode: cheapest[0],
    cost: cheapest[1],
    label: TRANSPORT_MODES[cheapest[0]].label,
    emoji: TRANSPORT_MODES[cheapest[0]].emoji,
    allOptions: costs
  };
}

/**
 * Recommends balanced (best value) option
 * @param {number} distanceKm - Distance in kilometers
 * @returns {Object} Balanced recommendation
 */
function recommendBalanced(distanceKm) {
  const costs = calculateCosts(distanceKm);
  if (!costs) return null;
  
  // Auto (rickshaw) is often best balance of cost and comfort
  const balanced = costs.auto || costs.bus;
  
  return {
    mode: "auto",
    cost: balanced,
    label: "Auto Rickshaw",
    emoji: "🛺",
    reason: "Good balance of cost and comfort",
    allOptions: costs
  };
}

/**
 * Provides cost optimization summary
 * @param {string} distanceText - Distance string
 * @returns {Object} Cost summary with all recommendations
 */
function optimizeCost(distanceText) {
  const km = parseDistanceToKm(distanceText);
  if (!km) return null;
  
  const costs = calculateCosts(km);
  const cheapest = recommendCheapest(km);
  const balanced = recommendBalanced(km);
  
  return {
    distance: `${km.toFixed(1)} km`,
    allCosts: costs,
    cheapestOption: cheapest,
    balancedOption: balanced,
    summary: `For ${km.toFixed(1)}km: Cheapest is ${cheapest.label} at Rs ${cheapest.cost}. Best value is ${balanced.label} at Rs ${balanced.cost}.`
  };
}

module.exports = {
  calculateCosts,
  optimizeCost,
  recommendCheapest,
  recommendBalanced,
  parseDistanceToKm,
  TRANSPORT_MODES
};
