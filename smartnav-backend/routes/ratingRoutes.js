const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Monument = require('../models/Monument');

// GET /api/ratings/:monumentId – get all ratings for a monument
router.get('/:monumentId', async (req, res) => {
  try {
    const ratings = await Rating.find({ monumentId: req.params.monumentId }).sort({ createdAt: -1 });
    const avg = ratings.length
      ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
      : 0;
    res.json({ ratings, average: parseFloat(avg), count: ratings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ratings/:monumentId – add a rating
router.post('/:monumentId', async (req, res) => {
  try {
    const { userId, userName, stars, review } = req.body;
    if (!stars || stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1-5' });

    const rating = new Rating({
      monumentId: req.params.monumentId,
      userId: userId || 'guest',
      userName: userName || 'Anonymous',
      stars,
      review: review || ''
    });
    await rating.save();

    // Update monument average rating
    const allRatings = await Rating.find({ monumentId: req.params.monumentId });
    const avg = allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length;
    await Monument.findOneAndUpdate({ monumentId: req.params.monumentId }, { averageRating: avg });

    res.status(201).json({ success: true, rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
