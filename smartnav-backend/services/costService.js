const COST_PER_KM = 10;

const parseDistanceToKm = (distanceText) => {
  if (!distanceText || typeof distanceText !== "string") return null;
  const text = distanceText.toLowerCase().trim();

  const kmMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*km/);
  if (kmMatch) return Number(kmMatch[1]);

  const mMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*m/);
  if (mMatch) return Number(mMatch[1]) / 1000;

  return null;
};

const estimateCost = (distanceText) => {
  const km = parseDistanceToKm(distanceText);
  if (!km) return null;

  const baseCost = Math.max(20, Math.round(km * COST_PER_KM));

  return {
    value: `Rs ${baseCost}`,
    suggestions: [
      "Cheapest: Public bus for longer routes",
      "Balanced: Shared auto for medium distance",
      "Comfort: Cab for direct door-to-door travel"
    ]
  };
};

module.exports = {
  estimateCost,
  parseDistanceToKm
};
