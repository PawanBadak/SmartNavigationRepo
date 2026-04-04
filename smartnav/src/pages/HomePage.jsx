import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const HomePage = ({ onSelectPlace, onNavigateToLiveMap, currentDistrict, setCurrentDistrict }) => {
  const [mainPlaces, setMainPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState(19.1383);
  const [userLng, setUserLng] = useState(77.3210);
  const [locationName, setLocationName] = useState("Detecting location...");
  const [greeting, setGreeting] = useState("");

  const formatDistance = (d) => (!d || d === Infinity ? "–" : d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`);
  const formatDuration = (m) => (!m || m < 1 ? "<1 min" : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ""}`);

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening");
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        getLocationName(pos.coords.latitude, pos.coords.longitude);
      },
      () => getLocationName(userLat, userLng)
    );
  }, []);

  const getLocationName = async (lat, lng) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
      const a = res.data?.address || {};
      const city = a.city || a.town || a.village || "Unknown";
      const state = a.state || "";
      const district = a.county || a.state_district || "";
      setLocationName(`${city}, ${state}`);
      setCurrentDistrict(district || city);
    } catch {
      setLocationName("Location unavailable");
      setCurrentDistrict("Unknown");
    }
  };

  useEffect(() => {
    if (!currentDistrict) return;
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        let res = await axios.get(`${API_URL}/mainplaces?city=${encodeURIComponent(currentDistrict)}`);
        let places = res.data || [];
        if (places.length === 0) {
          res = await axios.get(`${API_URL}/mainplaces`);
          places = res.data || [];
        }
        const enriched = await Promise.all(places.map(async (place) => {
          const lat = place.coordinates?.lat, lng = place.coordinates?.lng;
          if (!lat || !lng) return { ...place, distanceMeters: Infinity, durationMinutes: null, distanceLabel: "–", durationLabel: "–" };
          let distanceMeters = haversine(userLat, userLng, lat, lng);
          let durationMinutes = Math.max(1, Math.ceil(distanceMeters / 13.9 / 60));
          try {
            const route = await axios.get(`https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${lng},${lat}?overview=false`);
            const r = route.data?.routes?.[0];
            if (r) { distanceMeters = Math.round(r.distance); durationMinutes = Math.max(1, Math.ceil(r.duration / 60)); }
          } catch (_) {}
          return { ...place, distanceMeters, durationMinutes, distanceLabel: formatDistance(distanceMeters), durationLabel: formatDuration(durationMinutes) };
        }));
        setMainPlaces(enriched);
      } catch { setMainPlaces([]); }
      finally { setLoading(false); }
    };
    fetchPlaces();
  }, [userLat, userLng, currentDistrict]);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userName = user?.name?.split(" ")[0] || "Explorer";

  const statCards = [
    { icon: "🏛️", label: "Heritage Sites", value: mainPlaces.length || "–", color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30", text: "text-amber-400" },
    { icon: "📍", label: "Your Location", value: locationName.split(",")[0] || "Detecting...", color: "from-lime-500/20 to-green-500/20", border: "border-lime-500/30", text: "text-lime-400" },
    { icon: "🌟", label: "Top Rated", value: mainPlaces.filter(p => p.isPopular).length || "–", color: "from-purple-500/20 to-violet-500/20", border: "border-purple-500/30", text: "text-purple-400" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#060b18] text-white">
      {/* Ambient gradient blobs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-lime-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[80px] pointer-events-none" />

      {/* Hero Section */}
      <div className="relative px-8 pt-10 pb-8">
        {/* Greeting + Location */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-lime-400 text-xs font-black uppercase tracking-[0.2em]">Live GPS Active</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">{userName}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <span>📍</span>
            <span>{locationName}</span>
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-4 text-center hover:scale-[1.03] transition-all`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className={`font-black text-lg ${s.text} truncate`}>{s.value}</p>
              <p className="text-slate-500 text-[10px] mt-0.5 truncate">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search destinations, monuments..."
            readOnly
            onClick={() => {}}
            className="w-full bg-white/[0.06] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-300 placeholder-slate-500 text-sm cursor-pointer hover:border-lime-400/40 hover:bg-white/[0.08] transition-all focus:outline-none"
          />
          <div className="absolute inset-y-0 right-4 flex items-center">
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg border border-white/10">⌘K</span>
          </div>
        </div>
      </div>

      {/* Places Section */}
      <div className="px-8 pb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-black text-white">Discover Places</h2>
            <p className="text-slate-500 text-sm mt-0.5">Tourist destinations near you</p>
          </div>
          {!loading && <span className="text-slate-400 text-sm">{mainPlaces.length} found</span>}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/[0.04] border border-white/8 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : mainPlaces.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-white mb-2">No Places Found</h3>
            <p className="text-slate-400 text-sm">No tourist places found for your current location</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mainPlaces.map((place, idx) => (
              <div
                key={place._id}
                onClick={() => onSelectPlace(place)}
                className="group relative bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-lime-400/30 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-lime-500/10 hover:scale-[1.01]"
              >
                {/* Large Image */}
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={place.imageUrl || `https://via.placeholder.com/800x400?text=${encodeURIComponent(place.name)}`}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/800x400?text=No+Image"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060b18] via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Distance badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-bold">{place.distanceLabel}</span>
                  </div>

                  {/* Popular badge */}
                  {place.isPopular && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      ⭐ Popular
                    </div>
                  )}

                  {/* Bottom overlay content */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-black drop-shadow-lg">{place.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {place.district && <span className="text-slate-300 text-xs">📍 {place.district}</span>}
                      {place.durationLabel && <span className="text-cyan-300 text-xs">🚗 {place.durationLabel} away</span>}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5">
                  {place.shortDescription && (
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">{place.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectPlace(place); }}
                      className="flex-1 py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black rounded-xl hover:shadow-lg hover:shadow-lime-500/30 transition-all duration-200 text-sm hover:scale-[1.02]"
                    >
                      🏛️ Explore Places
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigateToLiveMap(place); }}
                      className="px-5 py-3 bg-white/[0.06] border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 hover:border-cyan-400/40 transition-all text-sm"
                    >
                      🗺️ Map
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;