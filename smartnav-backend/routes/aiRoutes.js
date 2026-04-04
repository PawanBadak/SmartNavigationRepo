const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Monument = require('../models/Monument'); // ✅ Correct for files inside /routes/// Adjust based on your models folder
const MainPlace = require('../models/MainPlace');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;

const buildFallbackReply = (prompt, place) => {
  const q = (prompt || '').toLowerCase();
  const placeName = place?.name || 'this place';
  const shortDescription = place?.shortDescription || place?.description || 'A historical site worth visiting.';
  const timings = place?.timings || 'Timings are not available right now.';
  const entryFee = place?.entryFee || 'Entry fee details are not available right now.';
  const history = place?.history || 'Historical notes are currently limited for this place.';
  const highlights = Array.isArray(place?.highlights) && place.highlights.length > 0
    ? place.highlights.slice(0, 4).join(', ')
    : null;

  if (q.includes('timing') || q.includes('open') || q.includes('close')) {
    return `${placeName} timings: ${timings}`;
  }

  if (q.includes('fee') || q.includes('ticket') || q.includes('price')) {
    return `${placeName} entry fee: ${entryFee}`;
  }

  if (q.includes('history') || q.includes('background')) {
    return `History of ${placeName}: ${history}`;
  }

  if (q.includes('how to reach') || q.includes('route') || q.includes('nearby')) {
    return `You are exploring ${placeName}. Open Live Map and tap Start Navigation to get the best route, distance, and travel time by Walk/Bike/Car.`;
  }

  const highlightsBlock = highlights ? `\nHighlights: ${highlights}` : '';
  return `About ${placeName}: ${shortDescription}\n\nTimings: ${timings}\nEntry Fee: ${entryFee}${highlightsBlock}`;
};

const findPlaceFromPrompt = async (prompt) => {
  const question = (prompt || '').trim().toLowerCase();
  if (!question) return null;

  const [monuments, mainPlaces] = await Promise.all([
    Monument.find({}, 'name monumentId shortDescription description history timings entryFee highlights').lean(),
    MainPlace.find({}, 'name mainPlaceId shortDescription description history timings entryFee highlights').lean()
  ]);

  const monumentMatch = monuments.find((m) => question.includes((m.name || '').toLowerCase()));
  if (monumentMatch) {
    return { ...monumentMatch, placeType: 'monument' };
  }

  const mainPlaceMatch = mainPlaces.find((p) => question.includes((p.name || '').toLowerCase()));
  if (mainPlaceMatch) {
    return { ...mainPlaceMatch, placeType: 'mainplace' };
  }

  return null;
};

const buildTravelAssistantReply = (prompt, category) => {
  const q = (prompt || '').toLowerCase();

  if (category === 'transport' || q.includes('transport') || q.includes('how') || q.includes('travel')) {
    return `🚗 **Transportation Options Available:**

**Walking (1.2 m/s)** - Best for short distances (<5km)
- Pros: Eco-friendly, low cost, explore at own pace
- Tips: Comfortable shoes, sun protection, carry water

**Biking (5.5 m/s)** - Good for medium distances (5-30km)
- Pros: Affordable, healthier, good speed
- Tips: Check weather, wear helmet, know local routes

**Car/Taxi (13.9 m/s)** - Best for longer distances & groups
- Pros: Fast, comfortable, good for families
- Tips: Book in advance, negotiate rates, use apps

**Public Transit (10 m/s)** - Budget-friendly inter-city travel
- Pros: Affordable, social, reduces parking stress
- Tips: Check schedules, buy passes in advance

**Uber/Ola** - Convenient & flexible
- Pros: Safe, trackable, flexible timing
- Tips: Use app, share rides, compare prices

Use the Live Map for real-time navigation, distance, and route estimates!`;
  }

  if (category === 'attractions' || q.includes('attraction') || q.includes('place') || q.includes('visit')) {
    return `🏛️ **Nearby Attractions & Recommendations:**

**Historical Sites** - Ancient monuments and heritage locations
- Best time: Early morning or late afternoon
- Tip: Book tours in advance, bring camera

**Popular Destinations** - Well-reviewed and highly rated
- Includes caves, temples, viewpoints, museums
- Open Live Map to see all locations with directions

**Nearby Places** - Filtered by distance (up to 10km)
- Click the Live Map "Attractions" feature
- Filter by category: History, Nature, Food, Religious

**Top Rated** - Based on visitor reviews and ratings
- Most visited places with excellent feedback
- Check timings and entry fees before visiting

💡 Pro Tip: Check the 'Popular' filter for must-see attractions!`;
  }

  if (category === 'emergency' || q.includes('emergency') || q.includes('hospital') || q.includes('police')) {
    return `🚨 **Emergency Services Available:**

**Police - 100** (Crime, accidents, lost persons) 
- Response time: 1-5 minutes

**Ambulance - 102** (Medical emergencies, first aid)
- Response time: 3-10 minutes

**Fire Service - 101** (Fire, rescue operations)
- Response time: 2-5 minutes

**Tourist Helpline - 1363** (Lost items, tourist help)
- Response time: 15-30 minutes

**Poison Control - 1800-2268770** (Drug reactions)
- Response time: Immediate

**Traffic Police - 1073** (Road accidents)

**Safety Tips:**
✅ Save emergency contacts with your profile
✅ Use Live Map to find nearest hospitals
✅ Keep insurance document accessible
✅ Inform someone of your daily itinerary
✅ Keep travel documents secure

Stay safe and have a great trip! 🛡️`;
  }

  if (category === 'cultural' || q.includes('culture') || q.includes('activity') || q.includes('experience')) {
    return `🎭 **Cultural Activities & Experiences Available:**

**Historical Tours (2-4 hours, ₹500-2000)**
- Guided site tours with expert guides
- Available in English, Hindi, Marathi
- Best time: Early morning or late afternoon

**Cultural Workshops (2-3 hours, ₹800-3000)**
- Learn traditional crafts, art, music, dance
- Hands-on experience with local experts
- Book 1-2 days in advance

**Local Food Tours (2-3 hours, ₹300-1500)**
- Taste authentic cuisines and street food
- Vegetarian/dietary preferences available
- Evening time slots popular

**Spiritual & Meditation (1-2 hours, ₹200-1000)**
- Yoga sessions and meditation guides
- Flexible clothing recommended
- Best at early morning

**Night Tours & Events (2-3 hours, ₹400-2000)**
- Sound & light shows, cultural performances
- Night markets and special events
- Book tickets in advance

**Adventure Activities (4-8 hours, ₹1000-5000)**
- Trekking, rock climbing, water sports
- Professional guides and safety equipment
- Physical fitness required

📞 Contact: Local tour operators, hotels, or guides for bookings!`;
  }

  if (category === 'bookings' || q.includes('book') || q.includes('hotel') || q.includes('service')) {
    return `🏨 **Booking & Service Recommendations:**

**Accommodation** - Hotels & Stays
- Platforms: Booking.com, OYO, Airbnb, Local Hotels
- Price Range: ₹500-10000+ per night
- Tips: Book near attractions, check reviews, confirm amenities

**Transportation** - Travel & Transport
- Platforms: MakeMyTrip, Goibibo, Ola, Uber
- Tips: Book round-trip when possible, compare prices, use apps
- Local taxis available on demand

**Activities** - Tours & Experiences
- Platforms: Viator, GetYourGuide, Local Guides
- Price Range: ₹300-5000+ per activity
- Tips: Read reviews, confirm guide language, group size

**Dining** - Restaurants & Food Services
- Platforms: Zomato, Swiggy, Local Restaurants
- Price Range: ₹100-2000+ per meal
- Tips: Check ratings, look for special offers

**Travel Insurance** - Safety & Security
- Providers: ICICI, HDFC, Bajaj, TATA AIG
- Cost: ₹500-5000 for trip duration
- Covers: Medical, cancellation, emergencies

**Best Practices:**
✅ Book accommodation first
✅ Compare prices on multiple platforms
✅ Read recent reviews (last 3 months)
✅ Confirm cancellation policy
✅ Keep digital copies of all confirmations
✅ Use verified platforms only

Let me help you find the perfect services! 🎯`;
  }

  return `🌍 **SmartNav Travel Assistant at Your Service!**

I can help you with:
- 🚗 Transportation options (walk, bike, car, taxi, public transit)
- 🏛️ Nearby attractions and popular places
- 🚨 Emergency services and safety information
- 🎭 Cultural activities and local experiences
- 🏨 Booking recommendations for hotels, tours, food

Click the quick action buttons above or ask me anything about your travel needs. What would you like to know? 🌟`;
};

router.post('/', async (req, res) => {
  const { prompt, monumentId, mainPlaceId, placeName, category } = req.body;

  try {
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ reply: 'Please ask a question so I can help you.' });
    }

    // Detect travel assistant category from prompt if not specified
    let detectedCategory = category;
    const q = prompt.toLowerCase();
    if (!detectedCategory) {
      if (q.includes('transport') || q.includes('drive') || q.includes('travel') || q.includes('ride')) {
        detectedCategory = 'transport';
      } else if (q.includes('attraction') || q.includes('place') || q.includes('visit') || q.includes('see')) {
        detectedCategory = 'attractions';
      } else if (q.includes('emergency') || q.includes('hospital') || q.includes('police') || q.includes('help')) {
        detectedCategory = 'emergency';
      } else if (q.includes('culture') || q.includes('activity') || q.includes('experience') || q.includes('event')) {
        detectedCategory = 'cultural';
      } else if (q.includes('book') || q.includes('hotel') || q.includes('service') || q.includes('ticket')) {
        detectedCategory = 'bookings';
      }
    }

    let context = "You are a helpful travel assistant for tourists. Provide practical, accurate travel information.";
    let place = null;
    
    if (monumentId) {
      place = await Monument.findOne({ monumentId }).lean();
      if (place) {
        context = `The user is looking at ${place.name}. Context: ${place.description || place.shortDescription || 'No description available.'}. Help with travel-related questions.`;
      }
    }

    if (!place && mainPlaceId) {
      place = await MainPlace.findOne({ mainPlaceId }).lean();
      if (place) {
        context = `The user is exploring ${place.name}. Context: ${place.description || place.shortDescription || 'No description available.'}. Help with travel-related questions.`;
      }
    }

    if (!place && placeName) {
      const escaped = placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      place = await Monument.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } }).lean();
      if (!place) {
        place = await MainPlace.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } }).lean();
      }
      if (place) {
        context = `The user selected ${place.name}. Help with travel-related questions about this location and area.`;
      }
    }

    if (!place) {
      place = await findPlaceFromPrompt(prompt);
      if (place) {
        context = `The user asked about ${place.name}. Help with travel-related questions about this location.`;
      }
    }

    // Try LLM if available
    if (process.env.OPENAI_API_KEY && openai) {
      try {
        const systemPrompt = detectedCategory 
          ? `You are a friendly travel assistant specializing in ${detectedCategory}. Provide helpful, practical advice. Keep responses concise and useful. ${context}`
          : `You are a friendly travel assistant helping tourists. Provide helpful, practical travel advice. ${context}`;

        const response = await openai.chat.completions.create({
          model: "openrouter/auto",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
        });

        const aiReply = response?.choices?.[0]?.message?.content;
        if (aiReply) {
          return res.json({ reply: aiReply });
        }
      } catch (llmError) {
        console.warn("LLM unavailable, using fallback for:", detectedCategory);
      }
    }

    // Fallback response based on category
    const fallbackReply = detectedCategory 
      ? buildTravelAssistantReply(prompt, detectedCategory)
      : buildFallbackReply(prompt, place);

    res.json({ reply: fallbackReply });

  } catch (error) {
    console.error("🔥 AI ERROR:", error);
    const fallbackReply = buildTravelAssistantReply(prompt, category);
    res.json({ reply: fallbackReply });
  }
});

module.exports = router;