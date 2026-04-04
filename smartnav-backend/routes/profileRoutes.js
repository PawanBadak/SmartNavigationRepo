const express = require('express');
const router = express.Router();
const TouristProfile = require('../models/TouristProfile');

// GET or CREATE profile
router.get('/:userId', async (req, res) => {
  try {
    let profile = await TouristProfile.findOne({ userId: req.params.userId });
    
    if (!profile) {
      profile = new TouristProfile({ userId: req.params.userId });
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE profile
router.put('/:userId', async (req, res) => {
  try {
    const profile = await TouristProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD to favorites
router.post('/:userId/favorites', async (req, res) => {
  try {
    const { placeId } = req.body;
    const profile = await TouristProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { $addToSet: { favoritePlaces: placeId } },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REMOVE from favorites
router.delete('/:userId/favorites/:placeId', async (req, res) => {
  try {
    const profile = await TouristProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { $pull: { favoritePlaces: req.params.placeId } },
      { new: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SAVE itinerary
router.post('/:userId/itineraries', async (req, res) => {
  try {
    const { name, places, duration } = req.body;
    const profile = await TouristProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { $push: { savedItineraries: { name, places, duration } } },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET recommendations based on profile
router.get('/:userId/recommendations', async (req, res) => {
  try {
    const profile = await TouristProfile.findOne({ userId: req.params.userId });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Simple recommendation logic based on interests
    const recommendations = {
      based_on_interests: profile.interests || [],
      budget_level: profile.budget || 'moderate',
      group_size: profile.groupSize || 1,
      suggested_activities: getSuggestedActivities(profile.interests, profile.budget),
      accessibility_notes: profile.accessibilityNeeds || []
    };

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getSuggestedActivities(interests, budget) {
  const activities = {
    history: ['Historical Tours', 'Museum Visits', 'Archaeological Sites'],
    adventure: ['Trekking', 'Rock Climbing', 'Water Sports'],
    culture: ['Cultural Workshops', 'Traditional Art Classes', 'Local Dance'],
    food: ['Food Tours', 'Cooking Classes', 'Street Food Exploration'],
    nature: ['Nature Walks', 'Birdwatching', 'Botanical Gardens'],
    photography: ['Photography Tours', 'Sunrise/Sunset Sessions', 'Workshop'],
    shopping: ['Local Markets', 'Craft Fairs', 'Shopping Districts'],
    wellness: ['Yoga Sessions', 'Meditation', 'Spa & Wellness Centers']
  };

  const suggested = [];
  interests.forEach(interest => {
    if (activities[interest]) {
      suggested.push(...activities[interest]);
    }
  });

  return [...new Set(suggested)];
}

module.exports = router;
