const mongoose = require('mongoose');

const monumentSchema = new mongoose.Schema({
  monumentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shortDescription: String,
  description: String,
  history: String,
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  audioUrl: String,
  imageUrl: String,
  images: [String],
  category: { type: String, enum: ['Cave', 'Temple', 'Utility', 'Entry', 'Restaurant', 'Viewpoint'] },
  timings: String,
  entryFee: String,
  highlights: [String],
  isPopular: { type: Boolean, default: false },
  caveNumber: Number,
  parentPlaceId: { type: String, required: true } // 👈 this links sub-place to MainPlace
});

module.exports = mongoose.models.Monument || mongoose.model('Monument', monumentSchema);