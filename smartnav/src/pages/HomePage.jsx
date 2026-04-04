import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const HomePage = ({ onSelectPlace, onNavigateToLiveMap, currentDistrict, setCurrentDistrict }) => {
  const [mainPlaces, setMainPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState(19.1383); // Default to Nanded
  const [userLng, setUserLng] = useState(77.3210);
  const [locationName, setLocationName] = useState("Fetching location...");

  const formatDistance = (distanceMeters) => {
    if (!distanceMeters || distanceMeters === Infinity) return "...";
    if (distanceMeters >= 1000) return `${(distanceMeters / 1000).toFixed(1)} km`;
    return `${Math.round(distanceMeters)} m`;
  };

  const formatDurationFromMinutes = (minutes) => {
    if (!minutes || minutes < 1) return "<1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (rem === 0) return `${hours} hr`;
    return `${hours} hr ${rem} min`;
  };

  const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const fetchDrivingRouteSummary = async (fromLat, fromLng, toLat, toLng) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false&alternatives=false&steps=false`;
    const response = await axios.get(url);
    const route = response.data?.routes?.[0];
    if (!route) return null;
    return {
      distanceMeters: Math.round(route.distance),
      durationMinutes: Math.max(1, Math.ceil(route.duration / 60))
    };
  };

  // Reverse geocoding using OpenStreetMap Nominatim API
  const getLocationName = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      const data = response.data;
      const city = data.address?.city || data.address?.town || data.address?.village || "Unknown";
      const state = data.address?.state || "";
      const district = data.address?.county || data.address?.state_district || "";
      const taluka = data.address?.subdistrict || "";
      setLocationName(`${city}, ${state}\n${district}${taluka ? `, ${taluka}` : ""}`);
      setCurrentDistrict(district || city); // Use district if available, else city
      console.log("Detected location:", { city, district, state, currentDistrict: district || city });
    } catch (error) {
      console.error("Error fetching location name:", error);
      setLocationName("Location unavailable");
      setCurrentDistrict("Unknown");
    }
  };

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        getLocationName(lat, lng);
      },
      (error) => {
        console.log("Location permission denied, using default");
        getLocationName(userLat, userLng);
      }
    );
  }, [userLat, userLng]);

  // Fetch main places
  useEffect(() => {
    const fetchPlaces = async () => {
      if (!currentDistrict) {
        console.log("Waiting for currentDistrict to be set...");
        return;
      }
      console.log("Fetching places for district:", currentDistrict);
      setLoading(true);
      try {
        const filteredRes = await axios.get(`${API_URL}/mainplaces?city=${encodeURIComponent(currentDistrict)}`);
        let places = filteredRes.data || [];

        // Fallback: if no exact district matches, show all main places instead of empty state.
        if (places.length === 0) {
          const allRes = await axios.get(`${API_URL}/mainplaces`);
          places = allRes.data || [];
        }

        console.log("Fetched places:", places.length, "places");
        const data = await Promise.all(places.map(async (place) => {
          const lat = place.coordinates?.lat;
          const lng = place.coordinates?.lng;

          if (!lat || !lng) {
            return {
              ...place,
              distanceMeters: Infinity,
              durationMinutes: null,
              distanceLabel: "...",
              durationLabel: "..."
            };
          }

          let distanceMeters = haversineDistanceMeters(userLat, userLng, lat, lng);
          let durationMinutes = Math.max(1, Math.ceil(distanceMeters / 13.9 / 60));

          try {
            const route = await fetchDrivingRouteSummary(userLat, userLng, lat, lng);
            if (route) {
              distanceMeters = route.distanceMeters;
              durationMinutes = route.durationMinutes;
            }
          } catch (routeErr) {
            console.error(`Route estimate failed for ${place.name}:`, routeErr.message);
          }

          return {
            ...place,
            distanceMeters,
            durationMinutes,
            distanceLabel: formatDistance(distanceMeters),
            durationLabel: formatDurationFromMinutes(durationMinutes),
          };
        }));

        setMainPlaces(data);
      } catch (err) {
        console.error("Error fetching main places:", err);
        setMainPlaces([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, [userLat, userLng, currentDistrict]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#050810] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading amazing places near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-y-auto bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] text-white custom-scrollbar font-sans">
      {/* Animated background blob */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-lime-400/30 via-cyan-400/20 to-indigo-500/10 rounded-full blur-3xl opacity-70 animate-pulse z-0" />

      {/* HEADER - Glassmorphism Card */}
      <div className="relative z-10 flex flex-col items-start p-8 pt-12 pb-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl shadow-xl px-8 py-6 flex items-center gap-6 w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-lime-400 via-cyan-400 to-indigo-500 shadow-lg animate-bounce-slow">
            <span className="text-4xl drop-shadow-lg">📍</span>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1 flex items-center gap-2">
              Nearby Places
              <span className="ml-2 px-3 py-1 rounded-full bg-gradient-to-r from-lime-400 via-cyan-400 to-indigo-500 text-black text-xs font-bold shadow-md animate-glow">
                LIVE
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full bg-lime-400 animate-pulse shadow-lime-400/50 shadow-md"></span>
              <span className="text-slate-200 text-lg font-medium whitespace-pre-line drop-shadow">
                {locationName} (District: {currentDistrict})
              </span>
            </div>
            <p className="text-slate-400 text-base mt-2 font-light">
              Explore the best places around you
            </p>
          </div>
        </div>
      </div>

      {/* MAIN PLACES - Horizontal Scroll */}
      <div className="relative z-10 px-8 pb-12 pt-2">
        <h2 className="text-3xl font-bold text-white mb-8 tracking-tight drop-shadow-lg">Best Tourist Places</h2>

        {mainPlaces.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No best tourist place found in this city</p>
          </div>
        ) : (
          <div className="flex gap-8 overflow-x-auto pb-2 custom-scrollbar snap-x">
            {mainPlaces.map((place) => (
              <div
                key={place._id}
                onClick={() => onSelectPlace(place)}
                className="min-w-[340px] max-w-xs bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden cursor-pointer border border-white/10 shadow-2xl hover:shadow-lime-400/30 hover:scale-105 transition-all duration-300 snap-center group relative"
                style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)' }}
              >
                {/* IMAGE */}
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={place.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-gradient-to-tr from-lime-400 via-cyan-400 to-indigo-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                    {place.distanceLabel}
                  </div>
                </div>

                {/* DETAILS */}
                <div className="p-6">
                  <h3 className="text-white font-extrabold text-xl mb-2 tracking-tight drop-shadow-lg">
                    {place.name}
                  </h3>
                  <p className="text-slate-200 text-base mb-3 line-clamp-2 font-light">
                    {place.shortDescription}
                  </p>
                  <p className="text-xs text-slate-300 mb-3">ETA by car: {place.durationLabel}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToLiveMap(place);
                    }}
                    className="w-full bg-gradient-to-r from-lime-400 to-cyan-500 text-black font-bold py-2 px-4 rounded-full hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Live Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom styles for premium effects */}
      <style>{`
        .animate-bounce-slow {
          animation: bounce 2.5s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-glow {
          animation: glow 1.5s infinite alternate;
        }
        @keyframes glow {
          from { box-shadow: 0 0 8px 2px #a3e635, 0 0 0 #06b6d4; }
          to { box-shadow: 0 0 24px 8px #06b6d4, 0 0 0 #a3e635; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;