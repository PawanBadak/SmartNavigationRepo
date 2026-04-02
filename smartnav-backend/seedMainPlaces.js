const mongoose = require('mongoose');
require('dotenv').config();

const MainPlace = require('./models/MainPlace');

const mainPlacesData = [
  {
    mainPlaceId: "ajanta-caves",
    name: "Ajanta Caves",
    shortDescription: "UNESCO World Heritage Site with ancient Buddhist cave paintings and sculptures",
    description: "The Ajanta Caves are 30 rock-cut Buddhist cave monuments dating from the 2nd century BCE to about 480 CE in the Aurangabad district of Maharashtra, India. The caves include paintings and rock-cut sculptures described as among the finest surviving examples of ancient Indian art, particularly expressive paintings that present emotions through gesture, pose and form.",
    history: "The caves were built in two phases: the first phase (caves 9-10) in the 2nd century BCE during the Hinayana phase of Buddhism, and the second phase (caves 1-8, 11-13, 15-29) in the 5th century CE during the Mahayana phase under the Vakataka dynasty.",
    coordinates: { lat: 20.5519, lng: 75.7033 },
    imageUrl:"/images/ajanthamain.png",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/9/9c/Ajanta_Cave_1_Bodhisattva_Padmapani.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Ajanta_Caves_Cave_1.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/3a/Ajanta_Caves_Entrance.jpg"
    ],
    category: "Heritage Site",
    district: "Aurangabad",
    state: "Maharashtra",
    entryFee: "Indian: ₹40, Foreign: ₹600",
    timings: "9:00 AM - 5:30 PM (Closed on Mondays)",
    highlights: [
      "30 rock-cut caves with paintings and sculptures",
      "World-famous Buddhist art from 5th century",
      "Padmapani and Vajrapani paintings in Cave 1",
      "Largest collection of Jataka tales in Cave 17",
      "Reclining Buddha in Cave 26"
    ],
    isPopular: true
  }
];

async function seedMainPlaces() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await MainPlace.deleteMany({});

    const inserted = await MainPlace.insertMany(mainPlacesData);
    console.log("Inserted main places:", inserted.length);

    console.log("✅ Main Places Database Seeded Successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

seedMainPlaces();