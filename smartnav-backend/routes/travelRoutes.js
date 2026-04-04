const express = require('express');
const router = express.Router();
const Monument = require('../models/Monument');
const MainPlace = require('../models/MainPlace');

// Transportation options for different modes
const transportationGuides = {
  walk: {
    avgSpeed: '1.2 m/s (~4.3 km/h)',
    pros: 'Eco-friendly, low cost, explore at own pace',
    cons: 'Slow for long distances, tiring',
    bestFor: 'Short distances (<5km), exploring local areas',
    tips: 'Wear comfortable shoes, carry water, use sun protection'
  },
  bike: {
    avgSpeed: '5.5 m/s (~20 km/h)',
    pros: 'Good speed, affordable, healthier than car',
    cons: 'Weather dependent, requires fitness',
    bestFor: 'Medium distances (5-30km), hilly terrain',
    tips: 'Check weather, wear helmet, know local cycling routes'
  },
  car: {
    avgSpeed: '13.9 m/s (~50 km/h)',
    pros: 'Fastest, comfortable, good for groups',
    cons: 'Fuel costs, parking, traffic',
    bestFor: 'Long distances, full tours, family groups',
    tips: 'Book in advance, check fuel prices, hire local drivers'
  },
  publicTransit: {
    avgSpeed: '10 m/s (~35 km/h)',
    pros: 'Affordable, social, reduces parking stress',
    cons: 'Fixed schedules, crowded',
    bestFor: 'Inter-city travel, budget travelers',
    tips: 'Check local schedules, buy passes in advance, ask locals'
  },
  taxi: {
    avgSpeed: '12 m/s (~43 km/h)',
    pros: 'Convenient, flexible, safe',
    cons: 'More expensive than public transit',
    bestFor: 'Airport transfers, quick trips, groups',
    tips: 'Negotiate rates before, use apps (Uber/Ola where available), share rides'
  }
};

// GET /api/travel/transportation
router.get('/transportation', (req, res) => {
  try {
    const { mode, distance } = req.query;

    if (mode && transportationGuides[mode]) {
      const modeData = transportationGuides[mode];
      return res.json({
        mode,
        ...modeData,
        estimatedTime: calculateTravelTime(mode, distance)
      });
    }

    res.json({
      allModes: Object.keys(transportationGuides),
      guides: transportationGuides,
      recommendation: 'Explore different modes by specifying ?mode=walk|bike|car|publicTransit|taxi'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/travel/attractions - Nearby attractions with filters
router.get('/attractions', async (req, res) => {
  try {
    const { lat, lng, radius = 10, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Get all monuments and main places
    const [monuments, mainPlaces] = await Promise.all([
      Monument.find({}, 'name monumentId category coordinates imageUrl shortDescription isPopular').lean(),
      MainPlace.find({}, 'name mainPlaceId category coordinates imageUrl shortDescription isPopular').lean()
    ]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const allAttractions = [
      ...monuments.map(m => ({ ...m, type: 'monument', placeId: m.monumentId })),
      ...mainPlaces.map(m => ({ ...m, type: 'mainplace', placeId: m.mainPlaceId }))
    ];

    let filtered = allAttractions
      .filter(a => a.coordinates)
      .map(a => ({
        ...a,
        distance: calculateDistance(userLat, userLng, a.coordinates.lat, a.coordinates.lng)
      }))
      .filter(a => a.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    if (category) {
      filtered = filtered.filter(a => a.category?.toLowerCase() === category.toLowerCase());
    }

    const topAttractions = filtered.slice(0, 10).map(a => ({
      name: a.name,
      type: a.type,
      placeId: a.placeId,
      category: a.category,
      distance: `${a.distance.toFixed(2)} km`,
      image: a.imageUrl,
      description: a.shortDescription,
      isPopular: a.isPopular
    }));

    res.json({
      attractions: topAttractions,
      total: topAttractions.length,
      categories: [...new Set(filtered.map(a => a.category))]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/travel/emergency - Emergency services info
router.get('/emergency', (req, res) => {
  try {
    const emergencyServices = {
      police: {
        number: '100',
        type: 'Emergency',
        response: '1-5 minutes',
        services: 'Crime, accident, lost persons'
      },
      ambulance: {
        number: '102',
        type: 'Medical Emergency',
        response: '3-10 minutes',
        services: 'Medical emergency, first aid'
      },
      fireService: {
        number: '101',
        type: 'Fire Emergency',
        response: '2-5 minutes',
        services: 'Fire, rescue operations'
      },
      touristHelpline: {
        number: '1363',
        type: 'Tourist Assistance',
        response: '15-30 minutes',
        services: 'Tourist help, lost items, guidance'
      },
      trafficPolice: {
        number: '1073',
        type: 'Traffic',
        response: 'variable',
        services: 'Road accidents, traffic violations'
      },
      poisonControl: {
        number: '1800-2268770',
        type: 'Medical',
        response: 'immediate',
        services: 'Poisoning, allergic reactions'
      }
    };

    const hospitalInfo = {
      type: 'Hospital Locator',
      suggestion: 'Use your location to find nearest hospitals via Live Map',
      tips: 'Always save hospital contact with emergency contact',
      insurance: 'Keep travel insurance document handy'
    };

    res.json({
      emergencyNumbers: emergencyServices,
      hospitalFinder: hospitalInfo,
      safetyTips: [
        'Keep emergency contacts readily available',
        'Save this app with emergency phone numbers',
        'Inform someone of your daily itinerary',
        'Keep copy of important documents',
        'Register with your embassy if traveling internationally'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/travel/cultural-activities - Cultural & experiential activities
router.get('/cultural-activities', async (req, res) => {
  try {
    const culturalActivities = {
      historicalTours: {
        name: 'Historical Site Tours',
        description: 'Guided tours of ancient monuments and heritage sites',
        bestTime: 'Early morning or late afternoon',
        duration: '2-4 hours',
        costRange: '₹500-2000',
        inclusions: 'Guide, entry fee, water',
        tips: 'Book in advance, wear comfortable shoes'
      },
      culturalWorkshops: {
        name: 'Cultural Workshops',
        description: 'Learn traditional crafts, art, music, or dance',
        bestTime: 'Morning or afternoon sessions',
        duration: '2-3 hours',
        costRange: '₹800-3000',
        inclusions: 'Materials, trainer, certification',
        tips: 'Book 1-2 days in advance'
      },
      foodTours: {
        name: 'Local Food Tours',
        description: 'Taste authentic local cuisines and street food',
        bestTime: 'Lunch or dinner',
        duration: '2-3 hours',
        costRange: '₹300-1500',
        inclusions: 'Food tastings, beverage, dessert',
        tips: 'Inform about dietary preferences'
      },
      spiritualExperiences: {
        name: 'Spiritual & Meditation',
        description: 'Engage in meditation, yoga, or spiritual practices',
        bestTime: 'Early morning',
        duration: '1-2 hours',
        costRange: '₹200-1000',
        inclusions: 'Session, mat, guidance',
        tips: 'Flexible clothing, empty stomach'
      },
      nightActivities: {
        name: 'Night Tours & Events',
        description: 'Sound & light shows, cultural performances, night markets',
        bestTime: 'Evening/Night',
        duration: '2-3 hours',
        costRange: '₹400-2000',
        inclusions: 'Viewing, seating, experience',
        tips: 'Book tickets in advance'
      },
      adventureActivities: {
        name: 'Adventure Activities',
        description: 'Trekking, rock climbing, water sports, wildlife tours',
        bestTime: 'Morning, weather dependent',
        duration: '4-8 hours',
        costRange: '₹1000-5000',
        inclusions: 'Equipment, guide, safety gear',
        tips: 'Physical fitness required, proper attire'
      }
    };

    res.json({
      activities: culturalActivities,
      bookingTip: 'Contact local tour operators or hotels for bookings',
      languageAvailability: 'Most guides available in English, Hindi, Marathi'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/travel/bookings - Booking recommendations
router.get('/bookings', (req, res) => {
  try {
    const bookingServices = {
      accommodation: {
        category: 'Hotels & Stays',
        platforms: ['Booking.com', 'OYO', 'Airbnb', 'Local Hotels'],
        tips: 'Book near main attractions, check reviews, confirm amenities',
        priceRange: '₹500-10000+ per night'
      },
      transportation: {
        category: 'Travel & Transport',
        platforms: ['MakeMyTrip', 'Goibibo', 'Ola', 'Uber', 'Local Taxis'],
        tips: 'Book round trip if possible, compare prices, use apps',
        priceRange: 'Varies by distance and mode'
      },
      activities: {
        category: 'Tours & Experiences',
        platforms: ['Viator', 'GetYourGuide', 'Local Guides', 'Hotel Concierge'],
        tips: 'Read reviews, confirm guide language, group size',
        priceRange: '₹300-5000+ per activity'
      },
      food: {
        category: 'Dining & Food',
        platforms: ['Zomato', 'Swiggy', 'Local Restaurants', 'Food Courts'],
        tips: 'Check ratings, confirm cuisines, look for special offers',
        priceRange: '₹100-2000+ per meal'
      },
      insurance: {
        category: 'Travel Insurance',
        platforms: ['ICICI', 'HDFC', 'Bajaj', 'TATA AIG'],
        tips: 'Buy before travel, cover medical and cancellation',
        priceRange: '₹500-5000 for trip duration'
      }
    };

    res.json({
      services: bookingServices,
      bestPractices: [
        'Book accommodations first for guaranteed availability',
        'Compare prices across 3-4 platforms',
        'Read recent reviews and ratings',
        'Confirm cancellation policy before booking',
        'Keep booking confirmations accessible (app or email)',
        'Book activities through verified platforms only'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate travel time
function calculateTravelTime(mode, distance) {
  if (!distance) return 'Specify distance in km';
  
  const distanceNum = parseFloat(distance);
  const speeds = {
    walk: 1.2,
    bike: 5.5,
    car: 13.9,
    publicTransit: 10,
    taxi: 12
  };

  const speed = speeds[mode];
  const timeMinutes = Math.ceil((distanceNum / speed) * 60);
  const hours = Math.floor(timeMinutes / 60);
  const mins = timeMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

module.exports = router;
