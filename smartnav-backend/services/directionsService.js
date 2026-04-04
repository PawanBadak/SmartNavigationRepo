const { Client } = require("@googlemaps/google-maps-services-js");

const mapsClient = new Client({});

const getDirectionsSummary = async ({ origin, destination }) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  if (!origin || typeof origin.latitude !== "number" || typeof origin.longitude !== "number") {
    return null;
  }
  if (!destination || !destination.trim()) return null;

  const response = await mapsClient.directions({
    params: {
      origin: { lat: origin.latitude, lng: origin.longitude },
      destination,
      key: apiKey,
      mode: "driving"
    },
    timeout: 5000
  });

  const route = response.data?.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) return null;

  return {
    distance: leg.distance?.text || null,
    duration: leg.duration?.text || null,
    routeSummary: route.summary || "Primary suggested route"
  };
};

module.exports = {
  getDirectionsSummary
};
