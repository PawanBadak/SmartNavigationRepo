const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const aiRoutes = require('./routes/aiRoutes');
const Monument = require('./models/Monument');
const MainPlace = require('./models/MainPlace');

console.log("Server starting...");

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRoutes);

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

    const all = await Monument.find({ category: "Cave" });

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
      .filter((m) => m.monumentId !== current.monumentId)
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

// CREATE
app.post('/api/monuments', async (req, res) => {
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
    const mainPlaces = await MainPlace.find().sort({ name: 1 });
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

// CREATE MAIN PLACE
app.post('/api/mainplaces', async (req, res) => {
  try {
    const newMainPlace = new MainPlace(req.body);
    await newMainPlace.save();
    res.status(201).json(newMainPlace);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE MAIN PLACE
app.put('/api/mainplaces/:id', async (req, res) => {
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

// DELETE MAIN PLACE
app.delete('/api/mainplaces/:id', async (req, res) => {
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

// UPDATE MONUMENT
app.put('/api/monuments/:id', async (req, res) => {
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

// DELETE MONUMENT
app.delete('/api/monuments/:id', async (req, res) => {
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});