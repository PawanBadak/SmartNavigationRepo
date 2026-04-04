const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');
const genId = () => crypto.randomBytes(8).toString('hex');

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, language, interests, budget } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const userId = genId();
    const userData = {
      userId,
      name,
      email: email || undefined,
      passwordHash: password ? hashPassword(password) : undefined,
      isGuest: !email,
      language: language || 'en',
      interests: interests || [],
      budget: budget || 'moderate'
    };

    const user = new User(userData);
    await user.save();

    const { passwordHash, ...safeUser } = user.toObject();
    res.status(201).json({ user: safeUser, token: userId });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found. Please register first.' });

    const hash = hashPassword(password);
    if (user.passwordHash !== hash) return res.status(401).json({ error: 'Incorrect password' });

    const { passwordHash, ...safeUser } = user.toObject();
    res.json({ user: safeUser, token: user.userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/profile
router.get('/:id/profile', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/profile – update profile / interests / emergency contact
router.put('/:id/profile', async (req, res) => {
  try {
    const { name, language, interests, budget, emergencyContact } = req.body;
    const updated = await User.findOneAndUpdate(
      { userId: req.params.id },
      { name, language, interests, budget, emergencyContact, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = updated.toObject();
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/favorites – toggle favorite place
router.put('/:id/favorites', async (req, res) => {
  try {
    const { monumentId } = req.body;
    const user = await User.findOne({ userId: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const idx = user.favoritePlaces.indexOf(monumentId);
    if (idx === -1) {
      user.favoritePlaces.push(monumentId);
    } else {
      user.favoritePlaces.splice(idx, 1);
    }
    await user.save();
    res.json({ favoritePlaces: user.favoritePlaces });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/visit – record a visit
router.post('/:id/visit', async (req, res) => {
  try {
    const { monumentId, monumentName } = req.body;
    await User.findOneAndUpdate(
      { userId: req.params.id },
      { $push: { visitHistory: { monumentId, monumentName, visitedAt: new Date() } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/itineraries – save an itinerary
router.post('/:id/itineraries', async (req, res) => {
  try {
    const { name, places, totalTime, totalCost } = req.body;
    const itinerary = { name, places, totalTime, totalCost, createdAt: new Date() };
    await User.findOneAndUpdate(
      { userId: req.params.id },
      { $push: { savedItineraries: itinerary } }
    );
    res.status(201).json({ success: true, itinerary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
