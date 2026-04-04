const mongoose = require('mongoose');

const touristProfileSchema = new mongoose.Schema({
  userId: { type: String, unique: true, sparse: true },
  name: String,
  email: String,
  phoneNumber: String,
  language: { type: String, enum: ['en', 'hi', 'mr'], default: 'en' },
  interests: [{ type: String, enum: ['history', 'adventure', 'culture', 'food', 'nature', 'photography', 'shopping', 'wellness'] }],
  visitedPlaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Monument' }],
  favoritePlaces: [{ type: String }],
  budget: { type: String, enum: ['budget', 'moderate', 'luxury'], default: 'moderate' },
  travelDates: {
    startDate: Date,
    endDate: Date
  },
  groupSize: { type: Number, default: 1 },
  accessibilityNeeds: [String],
  dietaryPreferences: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  savedItineraries: [{
    name: String,
    places: [String],
    duration: Number, // in days
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.TouristProfile || mongoose.model('TouristProfile', touristProfileSchema);
