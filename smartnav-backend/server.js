const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const travelRoutes = require('./routes/travelRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const Monument = require('./models/Monument');
const MainPlace = require('./models/MainPlace');
const TouristProfile = require('./models/TouristProfile');
const Rating = require('./models/Rating');
const User = require('./models/User');

console.log("Server starting...");

if (!process.env.MONGO_URI) {
  console.warn('⚠️ MONGO_URI is missing. Check smartnav-backend/.env');
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ratings', ratingRoutes);

app.get('/travel-assistant', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ SmartNav connected to MongoDB Atlas!"))
  .catch(err => console.error("❌ CONNECTION ERROR:", err.message));



// ✅ ROOT API
app.get('/', (req, res) => {
  res.send("SmartNav Backend is Online!");
});

// ✅ NEARBY API (OUTSIDE — VERY IMPORTANT)
app.get("/api/monuments/nearby/:id", async (req, res) => {
  try {
    const current = await Monument.findOne({
      monumentId: req.params.id
    });

    if (!current) {
      return res.status(404).json({ message: "Monument not found" });
    }

    // Prefer nearby places from the same parent place to avoid unrelated locations (e.g., Ajanta shown for Nanded).
    let all = [];
    if (current.parentPlaceId) {
      all = await Monument.find({ parentPlaceId: current.parentPlaceId });
    }

    // Fallback only if parentPlaceId is missing or no siblings exist.
    if (!all || all.length === 0) {
      all = await Monument.find({ category: "Cave" });
    }

    // 🔥 Distance calculation
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const toRad = (x) => (x * Math.PI) / 180;

      const φ1 = toRad(lat1);
      const φ2 = toRad(lat2);
      const Δφ = toRad(lat2 - lat1);
      const Δλ = toRad(lon2 - lon1);

      const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) *
          Math.cos(φ2) *
          Math.sin(Δλ / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return Math.round(R * c); // meters
    };

    const nearby = all
      .filter((m) => m.monumentId !== current.monumentId && m.coordinates?.lat && m.coordinates?.lng)
      .map((m) => ({
        monumentId: m.monumentId,
        name: m.name,
        distance: calculateDistance(
          current.coordinates.lat,
          current.coordinates.lng,
          m.coordinates.lat,
          m.coordinates.lng
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    res.json({
      current: current.name,
      next: nearby[0] || null,
      nearby,
    });

  } catch (err) {
    console.error("Nearby Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// GET ALL
app.get('/api/monuments', async (req, res) => {
  try {
    const monuments = await Monument.find().sort({ caveNumber: 1 });
    console.log("📦 FULL DATA:", monuments.length);
    res.json(monuments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ MAIN PLACES NEARBY API
app.get('/api/mainplaces/nearby', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Haversine formula to calculate distance
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Fetch all main places
    const allPlaces = await MainPlace.find({ isPopular: true });

    const nearbyPlaces = allPlaces
      .map((place) => ({
        ...place.toObject(),
        distance: calculateDistance(userLat, userLng, place.coordinates.lat, place.coordinates.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Limit to 10 nearest

    res.json(nearbyPlaces);
  } catch (err) {
    console.error("Nearby Main Places Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/monuments/:id', async (req, res) => {
  try {
    console.log("Requested ID:", req.params.id);

    const monument = await Monument.findOne({
      monumentId: req.params.id
    });

    if (!monument) {
      console.log("❌ Not found");
      return res.status(404).json({ message: "Not found" });
    }

    console.log("✅ Found:", monument.name);
    res.json(monument);
  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// CREATE (admin only)
app.post('/api/monuments', authMiddleware, async (req, res) => {
  try {
    const newMonument = new Monument(req.body);
    await newMonument.save();
    res.status(201).json(newMonument);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DISPLAY CAVES
app.get('/caves', async (req, res) => {
  try {
    const caves = await Monument.find({ category: 'Cave' }).sort({ caveNumber: 1 });
    let html = '<html><head><title>Caves Information</title></head><body><h1>Caves Information</h1>';
    caves.forEach(cave => {
      html += `<h2>${cave.name}</h2><p>${cave.shortDescription || 'No description'}</p><p>Cave Number: ${cave.caveNumber}</p>`;
      if (cave.imageUrl) {
        html += `<img src="${cave.imageUrl}" width="300" alt="${cave.name}"><br>`;
      }
      html += '<hr>';
    });
    html += '</body></html>';
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading caves');
  }
});

// GET ALL MAIN PLACES
app.get('/api/mainplaces', async (req, res) => {
  try {
    const { city } = req.query;
    let query = {};
    if (city) {
      query.district = { $regex: city, $options: 'i' }; // Case-insensitive match
      console.log("Filtering mainplaces by district:", city, "query:", query);
    } else {
      console.log("Fetching all mainplaces, no city filter");
    }
    const mainPlaces = await MainPlace.find(query).sort({ name: 1 });
    console.log("Found mainplaces:", mainPlaces.length);
    // Log districts of found places
    if (mainPlaces.length > 0) {
      console.log("Districts of found places:", mainPlaces.map(p => p.district));
    }
    res.json(mainPlaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SINGLE MAIN PLACE
app.get('/api/mainplaces/:id', async (req, res) => {
  try {
    const mainPlace = await MainPlace.findOne({ mainPlaceId: req.params.id });
    if (!mainPlace) {
      return res.status(404).json({ message: "Main place not found" });
    }
    res.json(mainPlace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE MAIN PLACE (admin only)
app.post('/api/mainplaces', authMiddleware, async (req, res) => {
  try {
    const newMainPlace = new MainPlace(req.body);
    await newMainPlace.save();
    res.status(201).json(newMainPlace);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE MAIN PLACE (admin only)
app.put('/api/mainplaces/:id', authMiddleware, async (req, res) => {
  try {
    const updatedMainPlace = await MainPlace.findOneAndUpdate(
      { mainPlaceId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMainPlace) {
      return res.status(404).json({ message: "Main place not found" });
    }
    res.json(updatedMainPlace);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE MAIN PLACE (admin only)
app.delete('/api/mainplaces/:id', authMiddleware, async (req, res) => {
  try {
    const deletedMainPlace = await MainPlace.findOneAndDelete({ mainPlaceId: req.params.id });
    if (!deletedMainPlace) {
      return res.status(404).json({ message: "Main place not found" });
    }
    res.json({ message: "Main place deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SUBPLACES FOR A MAIN PLACE
app.get('/api/mainplaces/:id/monuments', async (req, res) => {
  try {
    const monuments = await Monument.find({ parentPlaceId: req.params.id }).sort({ name: 1 });
    res.json(monuments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE MONUMENT (admin only)
app.put('/api/monuments/:id', authMiddleware, async (req, res) => {
  try {
    const updatedMonument = await Monument.findOneAndUpdate(
      { monumentId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMonument) {
      return res.status(404).json({ message: "Monument not found" });
    }
    res.json(updatedMonument);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE MONUMENT (admin only)
app.delete('/api/monuments/:id', authMiddleware, async (req, res) => {
  try {
    const deletedMonument = await Monument.findOneAndDelete({ monumentId: req.params.id });
    if (!deletedMonument) {
      return res.status(404).json({ message: "Monument not found" });
    }
    res.json({ message: "Monument deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ TRACK MONUMENT VISIT (increments visitCount)
app.post('/api/monuments/:id/visit', async (req, res) => {
  try {
    await Monument.findOneAndUpdate(
      { monumentId: req.params.id },
      { $inc: { visitCount: 1 } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ANALYTICS – Most visited monuments
app.get('/api/analytics/top-monuments', async (req, res) => {
  try {
    const top = await Monument.find({}).sort({ visitCount: -1 }).limit(10)
      .select('monumentId name visitCount averageRating category parentPlaceId imageUrl');
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ANALYTICS – Most visited main places
app.get('/api/analytics/top-places', async (req, res) => {
  try {
    const top = await MainPlace.find({}).sort({ visitCount: -1 }).limit(10)
      .select('mainPlaceId name visitCount category district imageUrl');
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ANALYTICS – Summary stats
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const [totalMonuments, totalPlaces, totalRatings] = await Promise.all([
      Monument.countDocuments(),
      MainPlace.countDocuments(),
      Rating.countDocuments()
    ]);
    const totalVisits = await Monument.aggregate([{ $group: { _id: null, total: { $sum: '$visitCount' } } }]);
    res.json({
      totalMonuments,
      totalPlaces,
      totalRatings,
      totalVisits: totalVisits[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ TRACK MAINPLACE VISIT
app.post('/api/mainplaces/:id/visit', async (req, res) => {
  try {
    await MainPlace.findOneAndUpdate(
      { mainPlaceId: req.params.id },
      { $inc: { visitCount: 1 } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ TOUR OPTIMIZER – get personalized recommendations based on interests
app.post('/api/tour/recommend', async (req, res) => {
  try {
    const { interests, availableHours, budget, mainPlaceId } = req.body;
    const availableMinutes = (availableHours || 3) * 60;

    let query = {};
    if (mainPlaceId) query.parentPlaceId = mainPlaceId;

    // Map interests to categories and marker types
    const interestToCategory = {
      history: ['Cave', 'Temple', 'Museum'],
      religious: ['Temple'],
      photography: ['Viewpoint', 'Cave', 'Temple'],
      food: ['Restaurant'],
      nature: ['Viewpoint', 'Park'],
      adventure: ['Viewpoint'],
      culture: ['Cave', 'Temple', 'Museum']
    };

    const interestToMarker = {
      history: ['history'],
      religious: ['religious'],
      photography: ['highlight', 'nature', 'history'],
      food: ['food'],
      nature: ['nature', 'water'],
      adventure: ['nature', 'highlight']
    };

    let monuments = await Monument.find(query).lean();

    // Filter by interests
    if (interests && interests.length > 0) {
      const targetCategories = [...new Set(interests.flatMap(i => interestToCategory[i] || []))];
      const targetMarkers = [...new Set(interests.flatMap(i => interestToMarker[i] || []))];

      const filtered = monuments.filter(m =>
        targetCategories.includes(m.category) || targetMarkers.includes(m.markerType)
      );
      if (filtered.length > 0) monuments = filtered;
    }

    // Sort by popularity & rating
    monuments.sort((a, b) => {
      const scoreA = (a.isPopular ? 10 : 0) + (a.averageRating || 0) * 2;
      const scoreB = (b.isPopular ? 10 : 0) + (b.averageRating || 0) * 2;
      return scoreB - scoreA;
    });

    // Pick places fitting time budget (treat 0 visitDuration as 30 mins)
    let totalTime = 0;
    const selected = [];
    const TRAVEL_BUFFER = 10; // 10 min travel between each

    for (const m of monuments) {
      const duration = (m.visitDuration && m.visitDuration > 0) ? m.visitDuration : 30;
      if (totalTime + duration + (selected.length > 0 ? TRAVEL_BUFFER : 0) <= availableMinutes) {
        selected.push(m);
        totalTime += duration + (selected.length > 1 ? TRAVEL_BUFFER : 0);
      }
      if (selected.length >= 10) break;
    }

    // Fallback: if nothing fits (very short time), pick top 3 with shortest visit
    if (selected.length === 0 && monuments.length > 0) {
      const sorted = [...monuments].sort((a, b) => ((a.visitDuration || 30) - (b.visitDuration || 30)));
      selected.push(...sorted.slice(0, Math.min(3, sorted.length)));
      totalTime = selected.reduce((s, m) => s + (m.visitDuration || 30), 0);
    }

    // Calculate rough cost
    const parseFee = (fee) => {
      if (!fee) return 0;
      const match = fee.toString().match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };

    const totalCost = selected.reduce((sum, m) => sum + parseFee(m.entryFee), 0);

    const itinerary = selected.map((m, idx) => ({
      order: idx + 1,
      monumentId: m.monumentId,
      name: m.name,
      category: m.category,
      visitDuration: m.visitDuration || 30,
      entryFee: m.entryFee || 'Free',
      imageUrl: m.imageUrl,
      coordinates: m.coordinates,
      isPopular: m.isPopular,
      averageRating: m.averageRating || 0
    }));

    res.json({
      itinerary,
      totalStops: selected.length,
      totalTimeMinutes: totalTime,
      estimatedCost: totalCost > 0 ? `₹${totalCost}` : 'Free'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});