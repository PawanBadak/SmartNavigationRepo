const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  monumentId: { type: String, required: true },
  userId: { type: String, default: 'guest' },
  userName: { type: String, default: 'Anonymous' },
  stars: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
