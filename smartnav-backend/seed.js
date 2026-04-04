const mongoose = require('mongoose');
require('dotenv').config();

// ✅ IMPORT the model from your new models folder
const Monument = require('./models/Monument'); // ✅ Correct: looks inside the current folder

const ajantaData = [
  {
    monumentId: "ajanta-cave-1",
    name: "Ajanta Cave 1",
    shortDescription: "Monastery with stunning Bodhisattva paintings",
    description: "Cave 1 is a magnificent Vihara (monastery) featuring the world-famous Padmapani and Vajrapani paintings.",
    history: "Constructed during the Vakataka dynasty under King Harishena's patronage. It represents the pinnacle of 5th-century Buddhist art.",
    coordinates: { lat: 20.5523, lng: 75.7004 },
   audioUrl: "/audio/cave1.mp3",
    imageUrl: "/images/cave1.png",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/9/9c/Ajanta_Cave_1_Bodhisattva_Padmapani.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Ajanta_Caves_Cave_1.jpg"
    ],
    category: "Cave",
    isPopular: true,
    caveNumber: 1,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-cave-2",
    name: "Ajanta Cave 2",
    shortDescription: "Well-preserved paintings",
    description: "Famous for its beautifully painted ceilings and its shrine to the Yaksha Hariti.",
    history: "Dates to the late 5th century CE. It is known for its intricate focus on feminine figures and celestial beings.",
    coordinates: { lat: 20.5525, lng: 75.7008 },
    audioUrl: "/audio/cave2.mp3",
    imageUrl: "/images/cave2.jpg",
    category: "Cave",
    isPopular: true,
    caveNumber: 2,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-cave-4",
    name: "Ajanta Cave 4",
    shortDescription: "Largest monastery",
    description: "The largest Vihara in Ajanta, featuring a colossal seated Buddha in the preaching pose.",
    history: "This 5th-century monastery was left incomplete, but its massive scale shows the ambition of the Vakataka builders.",
    coordinates: { lat: 20.5528, lng: 75.7015 },
    audioUrl: "/audio/cave4.mp3",
    imageUrl: "/images/cave4.png",
    category: "Cave",
    caveNumber: 4,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-cave-9",
    name: "Ajanta Cave 9",
    shortDescription: "Ancient chaitya hall",
    description: "One of the oldest Chaitya (prayer) halls at Ajanta, featuring a large horseshoe-shaped window.",
    history: "Dating back to the 1st century BCE, this belongs to the Hinayana phase of Buddhism where Buddha was represented by symbols.",
    coordinates: { lat: 20.5530, lng: 75.7020 },
    audioUrl: "/audio/cave9.mp3",
    imageUrl: "/images/cave9.png",
    category: "Cave",
    isPopular: true,
    caveNumber: 9,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-cave-10",
    name: "Ajanta Cave 10",
    shortDescription: "Oldest cave",
    description: "A massive prayer hall and the oldest cave in the complex, discovered by John Smith in 1819.",
    history: "Built in the 2nd century BCE. It contains some of the earliest surviving examples of Indian wall painting.",
    coordinates: { lat: 20.5532, lng: 75.7023 },
    audioUrl: "/audio/cave10.mp3",
    imageUrl: "/images/cave10.png",
    category: "Cave",
    isPopular: true,
    caveNumber: 10,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-cave-16",
    name: "Ajanta Cave 16",
    shortDescription: "Dying Princess painting",
    description: "A central monastery known for the emotionally powerful 'Dying Princess' mural.",
    history: "Commissioned by Varahadeva, the minister of King Harishena. It is considered one of the best locations for viewing the ravine.",
    coordinates: { lat: 20.5540, lng: 75.7035 },
    audioUrl: "/audio/cave16.mp3",
    imageUrl: "/images/cave16.png",
    category: "Cave",
    isPopular: true,
    caveNumber: 16,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-cave-17",
    name: "Ajanta Cave 17",
    shortDescription: "Largest collection of paintings",
    description: "Contains the best-preserved and most extensive collection of Jataka tale paintings.",
    history: "Another 5th-century Vihara. The murals here tell complex stories of Buddha's previous lives with incredible detail.",
    coordinates: { lat: 20.5542, lng: 75.7038 },
    audioUrl: "/audio/cave17.mp3",
    imageUrl: "/images/cave17.png",
    category: "Cave",
    isPopular: true,
    caveNumber: 17,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-cave-19",
    name: "Ajanta Cave 19",
    shortDescription: "Ornate chaitya",
    description: "A late-period Chaitya hall with a highly decorative facade and a standing Buddha figure.",
    history: "Built during the 5th century Mahayana phase. It represents the transition from symbolic to figurative representation.",
    coordinates: { lat: 20.5545, lng: 75.7042 },
    audioUrl: "/audio/cave19.mp3",
    imageUrl: "/images/cave19.png",
    category: "Cave",
    isPopular: true,
    caveNumber: 19,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-cave-26",
    name: "Ajanta Cave 26",
    shortDescription: "Reclining Buddha",
    description: "A large prayer hall famous for the 7-meter long sculpture of the Reclining Buddha (Mahaparinirvana).",
    history: "Constructed toward the end of the Ajanta period (late 5th century). The carvings here are much more elaborate than earlier caves.",
    coordinates: { lat: 20.5550, lng: 75.7048 },
    audioUrl: "/audio/cave26.mp3",
    imageUrl: "/images/cave26.png",
    category: "Cave",
    isPopular: true,
    caveNumber: 26,
    parentPlaceId: "ajanta-caves"
  },

  {
    monumentId: "ajanta-viewpoint",
    name: "Ajanta Viewpoint",
    shortDescription: "Panoramic view",
    coordinates: { lat: 20.5555, lng: 75.7055 },
    imageUrl: "/images/ajanthaview.png",
    category: "Viewpoint",
    isPopular: true,
    caveNumber: 99,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-mtdc-restaurant",
    name: "MTDC Restaurant",
    shortDescription: "Tourism restaurant",
    coordinates: { lat: 20.5518, lng: 75.7060 },
    imageUrl: "/images/Restaurant.png",
    category: "Restaurant",
    caveNumber: 100,
    parentPlaceId: "ajanta-caves"
  },
  {
    monumentId: "ajanta-main-entry",
    name: "Ajanta Entry Gate",
    shortDescription: "Main entrance",
    coordinates: { lat: 20.5510, lng: 75.7065 },
    imageUrl: "/images/Entrance.png",
    category: "Entry",
    caveNumber: 0,
    parentPlaceId: "ajanta-caves"
  }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

   await Monument.deleteMany({});

const inserted = await Monument.insertMany(ajantaData);
console.log("Inserted records:", inserted.length);

console.log("✅ Database Seeded Successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

seedDB();