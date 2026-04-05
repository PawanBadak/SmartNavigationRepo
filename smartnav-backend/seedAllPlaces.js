const mongoose = require('mongoose');
require('dotenv').config();

const Monument = require('./models/Monument');
const MainPlace = require('./models/MainPlace');

// =============================================
// ALL MAIN PLACES
// =============================================
const mainPlacesData = [
  {
    mainPlaceId: "ajanta-caves",
    name: "Ajanta Caves",
    shortDescription: "UNESCO World Heritage Site with ancient Buddhist cave paintings and sculptures",
    description: "The Ajanta Caves are 30 rock-cut Buddhist cave monuments dating from the 2nd century BCE to about 480 CE in the Aurangabad district of Maharashtra, India. The caves include paintings and rock-cut sculptures described as among the finest surviving examples of ancient Indian art.",
    history: "The caves were built in two phases: the first phase (caves 9-10) in the 2nd century BCE during the Hinayana phase of Buddhism, and the second phase in the 5th century CE during the Mahayana phase under the Vakataka dynasty.",
    coordinates: { lat: 20.5519, lng: 75.7033 },
    imageUrl: "/images/ajanthamain.png",
    category: "Heritage Site",
    district: "Aurangabad",
    state: "Maharashtra",
    entryFee: "Indian: ₹40, Foreign: ₹600",
    timings: "9:00 AM - 5:30 PM (Closed on Mondays)",
    highlights: [
      "30 rock-cut caves with paintings and sculptures",
      "World-famous Buddhist art from 5th century",
      "Padmapani and Vajrapani paintings in Cave 1",
      "Reclining Buddha in Cave 26"
    ],
    isPopular: true,
    visitDuration: 240
  },
  {
    mainPlaceId: "nanded-fort",
    name: "Nanded Fort",
    shortDescription: "Historic Mughal-era fort overlooking the Godavari river in Nanded city",
    description: "Nanded Fort is a historic fort built during the Mughal period. It stands on the banks of the Godavari river and offers panoramic views of the city. The fort has significant historical importance and is a popular tourist spot in Nanded.",
    history: "The fort was built during the reign of Aurangzeb in the 17th century. It served as a strategic military outpost along the Godavari river and was later used by the Marathas and the Nizams of Hyderabad.",
    coordinates: { lat: 19.1700, lng: 77.3100 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Nanded_Fort.jpg/1280px-Nanded_Fort.jpg",
    category: "Fort",
    district: "Nanded",
    state: "Maharashtra",
    entryFee: "Free",
    timings: "6:00 AM - 6:00 PM",
    highlights: [
      "Mughal-era architecture",
      "Panoramic view of Godavari river",
      "Historic battlements and towers",
      "Photography spot"
    ],
    isPopular: true,
    visitDuration: 90
  },
  {
    mainPlaceId: "gurudwara-sachkhand",
    name: "Gurudwara Sachkhand Sahib",
    shortDescription: "One of the holiest Sikh shrines, the final resting place of Guru Gobind Singh Ji",
    description: "Gurudwara Sachkhand Sahib Hazur Sahib is one of the five Takhts (seats of temporal authority) of Sikhism. Located in Nanded, Maharashtra, it is built on the banks of the Godavari river and is the place where Guru Gobind Singh Ji, the tenth Sikh Guru, passed away in 1708.",
    history: "Guru Gobind Singh Ji arrived in Nanded in 1708 on the request of Mughal Emperor Bahadur Shah I. He breathed his last here and before his death, declared that the Guru Granth Sahib would be the eternal Guru of the Sikhs. The Gurudwara was built to commemorate this sacred event.",
    coordinates: { lat: 19.1536, lng: 77.3113 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Hazur_Sahib_Nanded.jpg/1280px-Hazur_Sahib_Nanded.jpg",
    category: "Temple",
    district: "Nanded",
    state: "Maharashtra",
    entryFee: "Free",
    timings: "4:00 AM - 11:00 PM",
    highlights: [
      "One of the five Sikh Takhts",
      "Sacred shrine of Guru Gobind Singh Ji",
      "Golden dome and beautiful architecture",
      "Langar (community kitchen) for all visitors"
    ],
    isPopular: true,
    visitDuration: 120
  },
  {
    mainPlaceId: "bibi-ka-maqbara",
    name: "Bibi Ka Maqbara",
    shortDescription: "17th-century Mughal mausoleum known as the 'Taj of the Deccan'",
    description: "Bibi Ka Maqbara is a Mughal-era mausoleum located in Aurangabad, Maharashtra. Built by Prince Azam Shah in memory of his mother Dilras Banu Begum, wife of Mughal emperor Aurangzeb, it is often referred to as the 'Taj of the Deccan' due to its resemblance to the Taj Mahal.",
    history: "Constructed between 1651 and 1661 CE, the mausoleum was designed by architect Ata-ullah and engineer Hanspat Rai. It is built in the Mughal architectural style and serves as the tomb of Rabia-ud-Daurani, also known as Dilras Banu Begum.",
    coordinates: { lat: 19.9036, lng: 75.3236 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bibi_ka_Maqbara_evening.jpg/1280px-Bibi_ka_Maqbara_evening.jpg",
    category: "Heritage Site",
    district: "Aurangabad",
    state: "Maharashtra",
    entryFee: "Indian: ₹25, Foreign: ₹300",
    timings: "8:00 AM - 8:00 PM (Closed on Fridays)",
    highlights: [
      "Known as the Taj of the Deccan",
      "Mughal architecture with beautiful gardens",
      "Intricate marble latticework",
      "UNESCO tentative list heritage site"
    ],
    isPopular: true,
    visitDuration: 90
  },
  {
    mainPlaceId: "aurangabad-caves",
    name: "Aurangabad Caves",
    shortDescription: "Ancient Buddhist rock-cut caves with Tantric Buddhist sculptures from 6th-7th century CE",
    description: "The Aurangabad Caves are a group of 12 Buddhist shrines cut into a hillside in the city of Aurangabad. They contain beautiful sculptures particularly of female figures. The caves are divided into two groups – the western group (caves 1-5) and the eastern group (caves 6-10).",
    history: "The Aurangabad Caves were excavated between the 6th and 7th centuries CE under the patronage of Tantric Buddhism. They are known for their unique sculptural style that bridges the early Buddhist and later Tantrayana traditions.",
    coordinates: { lat: 19.9130, lng: 75.3600 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Aurangabad_Caves_3.jpg/1280px-Aurangabad_Caves_3.jpg",
    category: "Heritage Site",
    district: "Aurangabad",
    state: "Maharashtra",
    entryFee: "Free",
    timings: "9:00 AM - 5:30 PM",
    highlights: [
      "Ancient Buddhist rock-cut architecture",
      "Unique Tantric Buddhist sculptures",
      "Panoramic view of Aurangabad city",
      "Less crowded than Ajanta and Ellora"
    ],
    isPopular: true,
    visitDuration: 90
  }
];

// =============================================
// ALL MONUMENTS (sub-places for each MainPlace)
// =============================================
const monumentsData = [
  // -------- AJANTA CAVES monuments --------
  {
    monumentId: "ajanta-cave-1",
    name: "Ajanta Cave 1",
    shortDescription: "Monastery with stunning Bodhisattva paintings",
    description: "Cave 1 is a magnificent Vihara (monastery) featuring the world-famous Padmapani and Vajrapani paintings.",
    history: "Constructed during the Vakataka dynasty under King Harishena's patronage.",
    coordinates: { lat: 20.5523, lng: 75.7004 },
    audioUrl: "/audio/cave1.mp3",
    imageUrl: "/images/cave1.png",
    category: "Cave", isPopular: true, caveNumber: 1, parentPlaceId: "ajanta-caves", visitDuration: 30, entryFee: "Included"
  },
  {
    monumentId: "ajanta-cave-2",
    name: "Ajanta Cave 2",
    shortDescription: "Well-preserved paintings of celestial beings",
    description: "Famous for its beautifully painted ceilings and its shrine to the Yaksha Hariti.",
    coordinates: { lat: 20.5525, lng: 75.7008 },
    imageUrl: "/images/cave2.jpg",
    category: "Cave", isPopular: true, caveNumber: 2, parentPlaceId: "ajanta-caves", visitDuration: 25, entryFee: "Included"
  },
  {
    monumentId: "ajanta-cave-9",
    name: "Ajanta Cave 9",
    shortDescription: "Ancient chaitya hall from 1st century BCE",
    description: "One of the oldest Chaitya (prayer) halls at Ajanta, featuring a large horseshoe-shaped window.",
    coordinates: { lat: 20.5530, lng: 75.7020 },
    imageUrl: "/images/cave9.png",
    category: "Cave", isPopular: true, caveNumber: 9, parentPlaceId: "ajanta-caves", visitDuration: 20, entryFee: "Included"
  },
  {
    monumentId: "ajanta-cave-16",
    name: "Ajanta Cave 16",
    shortDescription: "Famous for the Dying Princess painting",
    description: "A central monastery known for the emotionally powerful 'Dying Princess' mural.",
    coordinates: { lat: 20.5540, lng: 75.7035 },
    imageUrl: "/images/cave16.png",
    category: "Cave", isPopular: true, caveNumber: 16, parentPlaceId: "ajanta-caves", visitDuration: 30, entryFee: "Included"
  },
  {
    monumentId: "ajanta-cave-17",
    name: "Ajanta Cave 17",
    shortDescription: "Largest collection of Jataka tale paintings",
    description: "Contains the best-preserved and most extensive collection of Jataka tale paintings.",
    coordinates: { lat: 20.5542, lng: 75.7038 },
    imageUrl: "/images/cave17.png",
    category: "Cave", isPopular: true, caveNumber: 17, parentPlaceId: "ajanta-caves", visitDuration: 35, entryFee: "Included"
  },
  {
    monumentId: "ajanta-cave-26",
    name: "Ajanta Cave 26",
    shortDescription: "Home of the 7m long Reclining Buddha sculpture",
    description: "A large prayer hall famous for the 7-meter long sculpture of the Reclining Buddha (Mahaparinirvana).",
    coordinates: { lat: 20.5550, lng: 75.7048 },
    imageUrl: "/images/cave26.png",
    category: "Cave", isPopular: true, caveNumber: 26, parentPlaceId: "ajanta-caves", visitDuration: 30, entryFee: "Included"
  },
  {
    monumentId: "ajanta-viewpoint",
    name: "Ajanta Viewpoint",
    shortDescription: "Panoramic view of the entire cave complex",
    coordinates: { lat: 20.5555, lng: 75.7055 },
    imageUrl: "/images/ajanthaview.png",
    category: "Viewpoint", isPopular: true, caveNumber: 99, parentPlaceId: "ajanta-caves", visitDuration: 15, entryFee: "Free"
  },
  {
    monumentId: "ajanta-mtdc-restaurant",
    name: "MTDC Restaurant",
    shortDescription: "Government tourism restaurant near the caves",
    coordinates: { lat: 20.5518, lng: 75.7060 },
    imageUrl: "/images/Restaurant.png",
    category: "Restaurant", caveNumber: 100, parentPlaceId: "ajanta-caves", visitDuration: 45, entryFee: "Free"
  },
  {
    monumentId: "ajanta-main-entry",
    name: "Ajanta Entry Gate",
    shortDescription: "Main entrance with ticket counter and amenities",
    coordinates: { lat: 20.5510, lng: 75.7065 },
    imageUrl: "/images/Entrance.png",
    category: "Entry", caveNumber: 0, parentPlaceId: "ajanta-caves", visitDuration: 10, entryFee: "₹40 (Indian)"
  },

  // -------- NANDED FORT monuments --------
  {
    monumentId: "nanded-fort-main-gate",
    name: "Nanded Fort Main Gate",
    shortDescription: "Historic main entrance of the Mughal-era fort",
    description: "The grand main gate of Nanded Fort, built in the Mughal architectural style with tall arched doorways and battlements.",
    coordinates: { lat: 19.1698, lng: 77.3095 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Nanded_Fort.jpg/640px-Nanded_Fort.jpg",
    category: "Entry", markerType: "history", isPopular: true, parentPlaceId: "nanded-fort", visitDuration: 10, entryFee: "Free"
  },
  {
    monumentId: "nanded-fort-watchtower",
    name: "Fort Watchtower",
    shortDescription: "Ancient watchtower with panoramic views of Godavari",
    description: "A tall watchtower within the Nanded Fort complex offering a commanding panoramic view of the Godavari river and the city of Nanded.",
    coordinates: { lat: 19.1705, lng: 77.3105 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Nanded_Fort.jpg/640px-Nanded_Fort.jpg",
    category: "Viewpoint", markerType: "history", isPopular: true, parentPlaceId: "nanded-fort", visitDuration: 20, entryFee: "Free"
  },
  {
    monumentId: "nanded-fort-battlements",
    name: "Fort Battlements & Walls",
    shortDescription: "The massive defensive walls and battlements of the fort",
    description: "Walk along the ancient battlements of Nanded Fort and experience the strategic military architecture of the Mughal era.",
    coordinates: { lat: 19.1702, lng: 77.3110 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Nanded_Fort.jpg/640px-Nanded_Fort.jpg",
    category: "Viewpoint", markerType: "history", parentPlaceId: "nanded-fort", visitDuration: 25, entryFee: "Free"
  },
  {
    monumentId: "nanded-fort-godavari-ghat",
    name: "Godavari River Ghat",
    shortDescription: "Sacred river ghat adjacent to the fort",
    description: "A serene river ghat on the banks of the Godavari river, adjacent to Nanded Fort. Ideal for evening visits and photography.",
    coordinates: { lat: 19.1695, lng: 77.3120 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Nanded_Fort.jpg/640px-Nanded_Fort.jpg",
    category: "Viewpoint", markerType: "nature", parentPlaceId: "nanded-fort", visitDuration: 20, entryFee: "Free"
  },

  // -------- GURUDWARA SACHKHAND monuments --------
  {
    monumentId: "sachkhand-main-darbar",
    name: "Main Darbar Hall",
    shortDescription: "The holiest sanctum with the Guru Granth Sahib",
    description: "The main Darbar Hall of Gurudwara Sachkhand Sahib where the Guru Granth Sahib is placed and prayers are conducted throughout the day.",
    coordinates: { lat: 19.1536, lng: 77.3113 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Hazur_Sahib_Nanded.jpg/640px-Hazur_Sahib_Nanded.jpg",
    category: "Temple", markerType: "religious", isPopular: true, parentPlaceId: "gurudwara-sachkhand", visitDuration: 45, entryFee: "Free"
  },
  {
    monumentId: "sachkhand-angitha-sahib",
    name: "Angitha Sahib",
    shortDescription: "Sacred cremation site of Guru Gobind Singh Ji",
    description: "Angitha Sahib marks the sacred site where Guru Gobind Singh Ji's last rites were performed in 1708. It is a deeply revered spot within the Gurudwara complex.",
    coordinates: { lat: 19.1540, lng: 77.3115 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Hazur_Sahib_Nanded.jpg/640px-Hazur_Sahib_Nanded.jpg",
    category: "Temple", markerType: "religious", isPopular: true, parentPlaceId: "gurudwara-sachkhand", visitDuration: 20, entryFee: "Free"
  },
  {
    monumentId: "sachkhand-langar-hall",
    name: "Langar Hall",
    shortDescription: "Free community kitchen serving thousands daily",
    description: "The Langar Hall of Hazur Sahib serves free meals to thousands of pilgrims and visitors every day, regardless of religion, caste or social status.",
    coordinates: { lat: 19.1533, lng: 77.3110 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Hazur_Sahib_Nanded.jpg/640px-Hazur_Sahib_Nanded.jpg",
    category: "Restaurant", markerType: "food", parentPlaceId: "gurudwara-sachkhand", visitDuration: 30, entryFee: "Free"
  },
  {
    monumentId: "sachkhand-golden-dome",
    name: "Golden Dome & Exterior",
    shortDescription: "The iconic golden dome of the Gurudwara",
    description: "The magnificent golden dome of Sachkhand Sahib is the most iconic feature of the Gurudwara, visible from many parts of Nanded city.",
    coordinates: { lat: 19.1537, lng: 77.3115 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Hazur_Sahib_Nanded.jpg/640px-Hazur_Sahib_Nanded.jpg",
    category: "Viewpoint", markerType: "highlight", isPopular: true, parentPlaceId: "gurudwara-sachkhand", visitDuration: 15, entryFee: "Free"
  },

  // -------- BIBI KA MAQBARA monuments --------
  {
    monumentId: "bibi-maqbara-main-tomb",
    name: "Main Mausoleum",
    shortDescription: "The stunning Taj-like central tomb of Dilras Banu Begum",
    description: "The central mausoleum of Bibi Ka Maqbara is an exquisite marble structure topped with a bulbous dome, closely resembling the Taj Mahal in Agra. It houses the tomb of Rabia-ud-Daurani.",
    coordinates: { lat: 19.9036, lng: 75.3236 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bibi_ka_Maqbara_evening.jpg/640px-Bibi_ka_Maqbara_evening.jpg",
    category: "Temple", markerType: "history", isPopular: true, parentPlaceId: "bibi-ka-maqbara", visitDuration: 30, entryFee: "₹25"
  },
  {
    monumentId: "bibi-maqbara-gardens",
    name: "Mughal Gardens",
    shortDescription: "Beautiful Charbagh gardens surrounding the mausoleum",
    description: "The Charbagh (four-quadrant) gardens of Bibi Ka Maqbara are laid out in the traditional Mughal garden style with fountains, pathways and lush lawns.",
    coordinates: { lat: 19.9040, lng: 75.3240 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bibi_ka_Maqbara_evening.jpg/640px-Bibi_ka_Maqbara_evening.jpg",
    category: "Viewpoint", markerType: "nature", isPopular: true, parentPlaceId: "bibi-ka-maqbara", visitDuration: 20, entryFee: "Included"
  },
  {
    monumentId: "bibi-maqbara-main-gate",
    name: "Main Entrance Gate",
    shortDescription: "Grand Mughal-style entrance gate with ornate carvings",
    description: "The main entrance gate of Bibi Ka Maqbara is a grand Mughal-style structure with intricate stone carvings, providing the first dramatic view of the mausoleum.",
    coordinates: { lat: 19.9030, lng: 75.3230 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bibi_ka_Maqbara_evening.jpg/640px-Bibi_ka_Maqbara_evening.jpg",
    category: "Entry", markerType: "history", parentPlaceId: "bibi-ka-maqbara", visitDuration: 10, entryFee: "₹25 (Indian)"
  },
  {
    monumentId: "bibi-maqbara-museum",
    name: "On-site Archaeological Museum",
    shortDescription: "Small museum showcasing artefacts from the Mughal period",
    description: "A small archaeological museum within the Bibi Ka Maqbara complex displaying sculptures, ceramics and artefacts from the Mughal and prior periods.",
    coordinates: { lat: 19.9033, lng: 75.3228 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bibi_ka_Maqbara_evening.jpg/640px-Bibi_ka_Maqbara_evening.jpg",
    category: "Viewpoint", markerType: "history", parentPlaceId: "bibi-ka-maqbara", visitDuration: 25, entryFee: "Included"
  },

  // -------- AURANGABAD CAVES monuments --------
  {
    monumentId: "aurangabad-cave-3",
    name: "Aurangabad Cave 3",
    shortDescription: "Cave featuring remarkable sculptural panels of Buddhist deities",
    description: "Cave 3 is the most impressive cave in Aurangabad, known for its beautiful Tantric Buddhist reliefs and the dancing Apsaras (celestial nymphs) sculpture panel.",
    coordinates: { lat: 19.9133, lng: 75.3602 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Aurangabad_Caves_3.jpg/640px-Aurangabad_Caves_3.jpg",
    category: "Cave", markerType: "history", isPopular: true, parentPlaceId: "aurangabad-caves", visitDuration: 30, entryFee: "Free"
  },
  {
    monumentId: "aurangabad-cave-7",
    name: "Aurangabad Cave 7",
    shortDescription: "Largest of the Aurangabad caves with a prayer hall",
    description: "Cave 7 in the eastern group is the largest of the Aurangabad Caves, featuring a pillared verandah, a prayer hall and a shrine with a seated Buddha figure.",
    coordinates: { lat: 19.9148, lng: 75.3620 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Aurangabad_Caves_3.jpg/640px-Aurangabad_Caves_3.jpg",
    category: "Cave", markerType: "history", parentPlaceId: "aurangabad-caves", visitDuration: 25, entryFee: "Free"
  },
  {
    monumentId: "aurangabad-caves-viewpoint",
    name: "Hilltop Viewpoint",
    shortDescription: "Panoramic city views from the hilltop above the caves",
    description: "The hilltop above the Aurangabad Caves offers a stunning panoramic view of the entire city of Aurangabad, Bibi Ka Maqbara and the surrounding landscape.",
    coordinates: { lat: 19.9140, lng: 75.3610 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Aurangabad_Caves_3.jpg/640px-Aurangabad_Caves_3.jpg",
    category: "Viewpoint", markerType: "nature", isPopular: true, parentPlaceId: "aurangabad-caves", visitDuration: 15, entryFee: "Free"
  },
  {
    monumentId: "aurangabad-caves-entry",
    name: "Caves Entry Point",
    shortDescription: "Main access path to the western and eastern cave groups",
    coordinates: { lat: 19.9128, lng: 75.3595 },
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Aurangabad_Caves_3.jpg/640px-Aurangabad_Caves_3.jpg",
    category: "Entry", markerType: "history", parentPlaceId: "aurangabad-caves", visitDuration: 5, entryFee: "Free"
  }
];

async function seedAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await MainPlace.deleteMany({});
    console.log("Deleted old MainPlaces");
    await Monument.deleteMany({});
    console.log("Deleted old Monuments");

    // Insert MainPlaces
    const mpInserted = await MainPlace.insertMany(mainPlacesData);
    console.log(`✅ Inserted ${mpInserted.length} main places`);

    // Fix locations for Monuments and Insert
    for (const mon of monumentsData) {
      if (mon.coordinates) {
        mon.location = {
          type: "Point",
          coordinates: [mon.coordinates.lng, mon.coordinates.lat]
        };
      }
    }
    const mnInserted = await Monument.insertMany(monumentsData);
    console.log(`✅ Inserted ${mnInserted.length} monuments`);

    // Print summary
    const mpTotal = await MainPlace.countDocuments();
    const monTotal = await Monument.countDocuments();
    const groups = await Monument.aggregate([
      { $group: { _id: "$parentPlaceId", count: { $sum: 1 } } }
    ]);
    console.log(`\n📊 Database Summary:`);
    console.log(`   MainPlaces: ${mpTotal}`);
    console.log(`   Monuments:  ${monTotal}`);
    console.log(`\n🗺️  Monuments per place:`);
    groups.forEach(g => console.log(`   ${g._id}: ${g.count} monuments`));

    console.log("\n🎉 All data seeded successfully!");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAll();
