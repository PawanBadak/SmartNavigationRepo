/**
 * 📍 Recommendation Engine
 * 
 * Location-based recommendation system using geospatial queries.
 * Finds nearby attractions, tourist places, and services.
 * Uses MongoDB geospatial indexing for efficient queries.
 */

const Monument = require("../models/Monument");
const MainPlace = require("../models/MainPlace");

/**
 * Finds nearby monuments/places using MongoDB geospatial query
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {number} radiusMeters - Search radius in meters (default: 10km)
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} List of nearby places
 */
async function findNearbyAttractions(latitude, longitude, radiusMeters = 10000, limit = 5) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return [];
  }

  try {
    // Ensure geospatial index exists
    await Monument.collection.ensureIndex({ location: "2dsphere" });

    const nearby = await Monument.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusMeters
        }
      }
    })
      .select("name description shortDescription category entryFee imageUrl")
      .limit(limit)
      .lean();

    return nearby.map((place) => ({
      name: place.name,
      category: place.category || "Unknown",
      description: place.shortDescription || place.description || "No description",
      entryFee: place.entryFee || "Free",
      image: place.imageUrl || null,
      rating: "★★★★★"
    }));
  } catch (error) {
    console.error("Geospatial query error:", error.message);
    return [];
  }
}

/**
 * Finds nearby places by category
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {string} category - Place category (Cave, Temple, Restaurant, etc.)
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Filtered nearby places
 */
async function findNearbyByCategory(latitude, longitude, category, limit = 5) {
  try {
    const nearby = await Monument.find({
      category: { $regex: category, $options: "i" },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: 15000
        }
      }
    })
      .select("name description category entryFee")
      .limit(limit)
      .lean();

    return nearby;
  } catch (error) {
    console.error("Category search error:", error.message);
    return [];
  }
}

/**
 * Gets popular/recommended places in a region
 * @param {string} region - Region/city name
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Popular places
 */
async function getPopularPlaces(region, limit = 10) {
  try {
    const places = await MainPlace.find({
      district: { $regex: region, $options: "i" },
      isPopular: true
    })
      .select("name description category imageUrl entryFee")
      .limit(limit)
      .lean();

    return places;
  } catch (error) {
    console.error("Popular places error:", error.message);
    return [];
  }
}

/**
 * Recommends places based on user preferences
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {Array<string>} interests - User interests (e.g., ["history", "food", "nature"])
 * @returns {Promise<Array>} Personalized recommendations
 */
async function getPersonalizedRecommendations(latitude, longitude, interests = []) {
  try {
    let query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: 20000
        }
      }
    };

    // Filter by interests if provided
    if (interests.length > 0) {
      query.category = {
        $in: interests.map((i) =>
          i.charAt(0).toUpperCase() + i.slice(1)
        )
      };
    }

    const recommendations = await Monument.find(query)
      .select("name description category entryFee isPopular")
      .limit(8)
      .lean();

    return recommendations;
  } catch (error) {
    console.error("Recommendation error:", error.message);
    return [];
  }
}

/**
 * Gets emergency services nearby
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @returns {Promise<Array>} Nearby emergency facilities
 */
async function findNearbyEmergency(latitude, longitude) {
  try {
    const emergencies = await Monument.find({
      category: { $in: ["Hospital", "Police", "Entry"] },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: 5000
        }
      }
    })
      .select("name category")
      .limit(3)
      .lean();

    return emergencies;
  } catch (error) {
    return [];
  }
}

module.exports = {
  findNearbyAttractions,
  findNearbyByCategory,
  getPopularPlaces,
  getPersonalizedRecommendations,
  findNearbyEmergency
};
