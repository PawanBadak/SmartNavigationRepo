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
  isPopular: { type: Boolean, default: true },
  visitDuration: { type: Number, default: 120 }, // estimated minutes
  crowdPeak: { type: String, default: '10AM-2PM' }, // when it gets crowded
  visitCount: { type: Number, default: 0 },
  entryFeeAmount: { type: Number, default: 0 } // numeric fee for optimizer
});

module.exports = mongoose.models.MainPlace || mongoose.model('MainPlace', mainPlaceSchema);