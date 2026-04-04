const Monument = require("../models/Monument");

const ensureGeoLocationForLegacyDocs = async () => {
  const legacyDocs = await Monument.find({
    "coordinates.lat": { $type: "number" },
    "coordinates.lng": { $type: "number" },
    $or: [
      { location: { $exists: false } },
      { "location.coordinates.1": { $exists: false } }
    ]
  })
    .select("_id coordinates")
    .limit(200)
    .lean();

  if (legacyDocs.length === 0) return;

  const operations = legacyDocs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: {
          location: {
            type: "Point",
            coordinates: [doc.coordinates.lng, doc.coordinates.lat]
          }
        }
      }
    }
  }));

  await Monument.bulkWrite(operations);
};

const findNearbyPlaces = async ({ latitude, longitude, limit = 5 }) => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return [];
  }

  await ensureGeoLocationForLegacyDocs();

  const monuments = await Monument.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        $maxDistance: 10000
      }
    }
  })
    .select("name description shortDescription entryFee location")
    .limit(limit)
    .lean();

  return monuments.map((m) => ({
    name: m.name,
    description: m.shortDescription || m.description || "No description available",
    entryFee: m.entryFee || "N/A"
  }));
};

module.exports = {
  findNearbyPlaces
};
