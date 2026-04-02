const mongoose = require('mongoose');

const mainPlaceSchema = new mongoose.Schema({
  mainPlaceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shortDescription: String,
  description: String,
  history: String,
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  imageUrl: String,
  images: [String],
  category: { type: String, enum: ['Heritage Site', 'Temple', 'Fort', 'Museum', 'Park'] },
  district: String,
  state: String,
  entryFee: String,
  timings: String,
  highlights: [String],
  distance: String,
  isPopular: { type: Boolean, default: true }
});

module.exports = mongoose.models.MainPlace || mongoose.model('MainPlace', mainPlaceSchema);