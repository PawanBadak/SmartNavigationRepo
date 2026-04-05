const mongoose = require('mongoose');

const monumentSchema = new mongoose.Schema({
  monumentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shortDescription: String,
  description: String,
  history: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  audioUrl: String,
  imageUrl: String,
  images: [String],
  category: { type: String, enum: ['Cave', 'Temple', 'Utility', 'Entry', 'Restaurant', 'Viewpoint', 'Museum', 'Park'] },
  markerType: {
    type: String,
    enum: ['religious', 'food', 'nature', 'history', 'stay', 'entry', 'washroom', 'water', 'parking', 'current', 'highlight']
  },
  timings: String,
  entryFee: String,
  highlights: [String],
  isPopular: { type: Boolean, default: false },
  caveNumber: Number,
  parentPlaceId: { type: String, required: true }, // 👈 this links sub-place to MainPlace
  visitCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  visitDuration: { type: Number, default: 30 }, // estimated minutes to visit
  crowdLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
});

monumentSchema.index({ location: "2dsphere" });

monumentSchema.pre("validate", function ensureGeoPoint() {
  if (this.coordinates?.lat != null && this.coordinates?.lng != null) {
    this.location = {
      type: "Point",
      coordinates: [this.coordinates.lng, this.coordinates.lat]
    };
  }
});

module.exports = mongoose.models.Monument || mongoose.model('Monument', monumentSchema);