const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String },
  isGuest: { type: Boolean, default: false },
  language: { type: String, enum: ['en', 'hi', 'mr'], default: 'en' },
  interests: [{
    type: String,
    enum: ['history', 'religious', 'photography', 'food', 'nature', 'adventure', 'culture', 'shopping']
  }],
  budget: { type: String, enum: ['budget', 'moderate', 'luxury'], default: 'moderate' },
  visitHistory: [{
    monumentId: String,
    monumentName: String,
    visitedAt: { type: Date, default: Date.now }
  }],
  favoritePlaces: [{ type: String }],
  savedItineraries: [{
    name: String,
    places: [{ monumentId: String, name: String, order: Number }],
    totalTime: Number, // in minutes
    totalCost: String,
    createdAt: { type: Date, default: Date.now }
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
