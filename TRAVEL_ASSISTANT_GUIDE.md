# SmartNav AI Travel Assistant - Implementation Guide

## Overview
SmartNav has been enhanced with a comprehensive AI-powered Travel Assistant that helps tourists with directions, nearby attractions, emergency services, cultural activities, and booking recommendations. The system is multilingual (English, Hindi, Marathi) and uses intelligent fallback responses when API keys are unavailable.

## Features Implemented

### 1. **Core AI Chat Features**
- **Quick Action Categories**: Buttons for quick access to common queries
  - 🚗 Transportation options
  - 🏛️ Nearby attractions
  - 🚨 Emergency services
  - 🎭 Cultural activities
  - 🏨 Booking recommendations

- **Context-Aware Responses**: Remembers current location and previous interactions
- **Multilingual Support**: Responds in English, Hindi, and Marathi
- **Graceful Fallback**: Works without OpenAI API key using intelligent templates

### 2. **Backend Travel Services** (`/api/travel`)

#### Transportation Guide (`GET /api/travel/transportation`)
Returns info on 5 travel modes:
- Walking: Best for short distances (<5km)
- Biking: Medium distances (5-30km)
- Car/Taxi: Long distances and groups
- Public Transit: Budget-friendly inter-city
- Ride Apps: Convenient and flexible

**Query Parameters:**
- `mode`: Specific mode (walk, bike, car, publicTransit, taxi)
- `distance`: Distance in km for travel time calculation

**Example:**
```
GET /api/travel/transportation?mode=car&distance=50
```

#### Attractions Finder (`GET /api/travel/attractions`)
Discovers nearby tourist attractions with filtering.

**Query Parameters:**
- `lat`: User latitude (required)
- `lng`: User longitude (required)
- `radius`: Search radius in km (default: 10)
- `category`: Filter by category (history, adventure, food, culture, etc.)

**Example:**
```
GET /api/travel/attractions?lat=20.5519&lng=75.7031&radius=5&category=Cave
```

#### Emergency Services (`GET /api/travel/emergency`)
Provides emergency contact numbers and safety information.

**Returns:**
- Police (100), Ambulance (102), Fire (101)
- Tourist Helpline (1363)
- Poison Control (1800-2268770)
- Safety tips and hospital finder guidance

#### Cultural Activities (`GET /api/travel/cultural-activities`)
Lists experiential and cultural activities available.

**Activity Types:**
- Historical Tours (₹500-2000, 2-4 hours)
- Cultural Workshops (₹800-3000, 2-3 hours)
- Food Tours (₹300-1500, 2-3 hours)
- Spiritual Activities (₹200-1000, 1-2 hours)
- Night Tours (₹400-2000, 2-3 hours)
- Adventure Activities (₹1000-5000, 4-8 hours)

#### Booking Services (`GET /api/travel/bookings`)
Curated recommendations for booking platforms.

**Categories:**
- Accommodation: Booking.com, OYO, Airbnb
- Transportation: MakeMyTrip, Goibibo, Ola, Uber
- Activities: Viator, GetYourGuide, Local Guides
- Food: Zomato, Swiggy
- Insurance: ICICI, HDFC, Bajaj, TATA AIG

### 3. **User Profile System** (`/api/profile`)

#### Get/Create Profile
```
GET /api/profile/:userId
```

#### Update Profile
```
PUT /api/profile/:userId
{
  name: "John Doe",
  email: "john@example.com",
  phoneNumber: "+91-XXXXXXXXXX",
  language: "en",
  interests: ["history", "adventure", "food"],
  budget: "moderate",
  travelDates: {
    startDate: "2026-04-05",
    endDate: "2026-04-10"
  },
  groupSize: 4,
  accessibilityNeeds: ["wheelchair", "vegetarian"],
  emergencyContact: {
    name: "Jane",
    phone: "+91-XXXXXXXXXX",
    relation: "Sister"
  }
}
```

#### Add to Favorites
```
POST /api/profile/:userId/favorites
{ placeId: "ajanta-cave-1" }
```

#### Save Itinerary
```
POST /api/profile/:userId/itineraries
{
  name: "4-Day Ajanta Tour",
  places: ["cave-1", "cave-2", "viewpoint"],
  duration: 4
}
```

#### Get Recommendations
```
GET /api/profile/:userId/recommendations
```

Returns activity suggestions based on:
- User interests (history, adventure, culture, food, nature, photography, shopping, wellness)
- Budget level (budget, moderate, luxury)
- Group size and accessibility needs

## Frontend Components

### AIChat Component (`src/components/AIChat.jsx`)
**New Props:**
- `currentMonumentId`: Selected monument for context
- `selectedPlace`: Selected main place for personalization

**Key Features:**
- Quick action buttons for 5 travel categories
- Auto-detection of query category
- Message history with proper formatting
- Loading state with animated indicator
- Category-aware response handling

**Usage:**
```jsx
<AIChat 
  currentMonumentId="cave-1"
  selectedPlace={{ mainPlaceId: "ajanta", name: "Ajanta Caves" }}
/>
```

## API Integration Examples

### Example 1: Find Nearby Attractions
```javascript
const response = await axios.get('http://localhost:5000/api/travel/attractions', {
  params: {
    lat: 20.5519,
    lng: 75.7031,
    radius: 10,
    category: 'Temple'
  }
});
```

### Example 2: Get Transportation Info
```javascript
const response = await axios.get('http://localhost:5000/api/travel/transportation', {
  params: {
    mode: 'car',
    distance: 25
  }
});
```

### Example 3: Send Chat Query with Category
```javascript
const response = await axios.post('http://localhost:5000/api/ai', {
  prompt: "What are the best transportation options for visiting nearby caves?",
  monumentId: "cave-1",
  category: "transport"
});
```

### Example 4: Create/Update User Profile
```javascript
const userId = "user_" + Math.random();
const response = await axios.put(
  `http://localhost:5000/api/profile/${userId}`,
  {
    name: "Tourist Name",
    language: "en",
    interests: ["history", "photography"],
    budget: "moderate",
    groupSize: 2
  }
);
```

## Database Models

### TouristProfile Schema
```javascript
{
  userId: String (unique),
  name: String,
  email: String,
  phoneNumber: String,
  language: "en" | "hi" | "mr",
  interests: ["history", "adventure", ...],
  visitedPlaces: [ObjectId],
  favoritePlaces: [String],
  budget: "budget" | "moderate" | "luxury",
  travelDates: { startDate, endDate },
  groupSize: Number,
  accessibilityNeeds: [String],
  dietaryPreferences: [String],
  emergencyContact: { name, phone, relation },
  savedItineraries: [{ name, places, duration, createdAt }],
  createdAt: Date,
  updatedAt: Date
}
```

## Configuration & Deployment

### Environment Variables
Add to `.env`:
```
OPENAI_API_KEY=your_api_key_here
MONGO_URI=your_mongodb_connection_string
```

### Without OpenAI API Key
The system works without API key using intelligent template-based responses. All features remain functional with fallback replies.

### Optional: Enable Voice Assistant
Current implementation supports text input. To add voice:

1. Add Web Speech API integration in AIChat
2. Add `<button onClick={startVoiceInput}>🎤</button>`
3. Implement speech-to-text conversion
4. Process like regular text input

## Testing the Features

### Test Transportation Guide
Open browser console and try:
```javascript
fetch('http://localhost:5000/api/travel/transportation?mode=car&distance=100')
  .then(r => r.json())
  .then(console.log)
```

### Test Quick Actions
Click any quick action button in the Chat interface: 🚗 🏛️ 🚨 🎭 🏨

### Test Emergency Services
```javascript
fetch('http://localhost:5000/api/travel/emergency')
  .then(r => r.json())
  .then(console.log)
```

### Test Attractions Finder
```javascript
fetch('http://localhost:5000/api/travel/attractions?lat=20.5519&lng=75.7031&radius=10')
  .then(r => r.json())
  .then(console.log)
```

## Extending the System

### Add New Transportation Mode
Edit `smartnav-backend/routes/travelRoutes.js`:
```javascript
const transportationGuides = {
  cable_car: {
    avgSpeed: '3 m/s (~10 km/h)',
    pros: 'Scenic, safe, unique experience',
    cons: 'Limited routes, scheduled times',
    bestFor: 'Mountain areas, sightseeing',
    tips: 'Book advance tickets, take photos'
  }
};
```

### Add New Cultural Activity
Edit `getBuilding travelRoutes.js`:
```javascript
const culturalActivities = {
  localMarketTours: {
    name: 'Local Market Tours',
    description: 'Explore traditional markets and local crafts',
    ...
  }
};
```

### Add New Travel Service Category
1. Create new route in `travelRoutes.js`
2. Add endpoint: `GET /api/travel/newservice`
3. Update AIChat quick actions
4. Add category detection in aiRoutes.js

### Customize Fallback Responses
Edit `buildTravelAssistantReply()` function in `aiRoutes.js` to match your location-specific information.

## Security Considerations

### API Keys
- Never commit `.env` file with keys
- Use environment variables for sensitive data
- Rotate API keys periodically

### User Data
- Validate all user inputs
- Sanitize database queries
- Implement rate limiting for API endpoints

### Emergency Data
- Keep emergency numbers updated
- Verify sources for emergency information
- Test emergency routes regularly

## Performance Optimization

### Database Queries
- Use `.lean()` for read-only queries
- Index frequently searched fields
- Cache tourist profile data

### Frontend Optimization
- Lazy load attraction images
- Debounce frequent API calls
- Cache travel service responses

### Backend Optimization
- Implement pagination for large datasets
- Use connection pooling
- Enable gzip compression

## Troubleshooting

### "Cannot find module" Errors
```bash
npm install --save-dev
# Or for backend:
cd smartnav-backend
npm install
```

### OpenAI API Failures
- Check `.env` for valid API key
- Verify API key has required permissions
- System falls back to template responses

### Missing Monument/Place Data
- Run seed scripts: `node seed.js` or `node seedMainPlaces.js`
- Check MongoDB connection
- Verify data format matches schema

### Chat Not Responsive
- Clear browser cache
- Check backend server is running
- Verify CORS settings in server.js

## Support & Documentation

For additional help:
1. Check the implementation in routes files
2. Review model schemas in `models/` directory
3. Test APIs using provided examples
4. Check browser console for error messages

---

**System Ready:** Your SmartNav platform is now a comprehensive AI Travel Assistant! 🌍🤖
