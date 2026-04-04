import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import axios from "axios";
import "maplibre-gl/dist/maplibre-gl.css";

const API_URL = "http://localhost:5000/api";

// Cave marker SVG
const createMarkerElement = (category, isSelected = false) => {
  const el = document.createElement("div");
  el.className = "custom-marker";
  
  const colors = {
    Cave: { bg: "#a3e635", icon: "🏛️" },
    Temple: { bg: "#f59e0b", icon: "🛕" },
    Restaurant: { bg: "#ef4444", icon: "🍽️" },
    Viewpoint: { bg: "#3b82f6", icon: "👁️" },
    Entry: { bg: "#8b5cf6", icon: "🎫" },
    Utility: { bg: "#6b7280", icon: "🔧" }
  };

  const config = colors[category] || colors.Cave;

  el.innerHTML = `
    <div style="
      width: ${isSelected ? '48px' : '40px'};
      height: ${isSelected ? '48px' : '40px'};
      background: ${config.bg};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isSelected ? '24px' : '20px'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 ${isSelected ? '20px' : '0'} ${config.bg};
      cursor: pointer;
      transition: all 0.2s ease;
      border: 3px solid white;
    ">
      ${config.icon}
    </div>
    ${isSelected ? `<div style="
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid ${config.bg};
    "></div>` : ''}
  `;

  return el;
};

const translations = {
  en: {
    liveCaveMap: "Live Cave Map",
    locationsActive: (n) => `${n} locations active`,
    loadingCaves: "Loading caves...",
    all: "All",
    popular: "Popular",
    nearby: "Nearby",
    caves: "Caves",
    views: "Views",
    nearestCave: "Nearest Cave",
    showOnMap: "Show on Map",
    navigatingTo: "Navigating to",
    end: "End",
    calculating: "Calculating...",
    readyToScan: "Ready to scan QR",
    scanning: "Scanning..."
  },
  hi: {
    liveCaveMap: "लाइव गुफा मानचित्र",
    locationsActive: (n) => `${n} स्थान सक्रिय हैं`,
    loadingCaves: "गुफाएँ लोड हो रही हैं...",
    all: "सभी",
    popular: "लोकप्रिय",
    nearby: "नज़दीकी",
    caves: "गुफाएँ",
    views: "दृश्य",
    nearestCave: "निकटतम गुफा",
    showOnMap: "मानचित्र पर दिखाएँ",
    navigatingTo: "इसकी ओर नेविगेट कर रहे हैं",
    end: "समाप्त",
    calculating: "गणना हो रही है...",
    readyToScan: "QR स्कैन के लिए तैयार",
    scanning: "स्कैन हो रहा है..."
  },
  mr: {
    liveCaveMap: "थेट गुहा नकाशा",
    locationsActive: (n) => `${n} ठिकाणे सक्रिय आहेत`,
    loadingCaves: "गुहा लोड होत आहेत...",
    all: "सर्व",
    popular: "लोकप्रिय",
    nearby: "जवळचे",
    caves: "गुहा",
    views: "दृश्य",
    nearestCave: "सर्वात जवळची गुहा",
    showOnMap: "नकाशावर दाखवा",
    navigatingTo: "नेव्हिगेट करत आहे",
    end: "समाप्त",
    calculating: "गणना सुरू आहे...",
    readyToScan: "QR स्कॅनसाठी तयार",
    scanning: "स्कॅनिंग..."
  }
};

const LiveMap = ({ onSelectMonument, selectedMonumentId, navigationTarget, language = "en", selectedMainPlace }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const [landmarks, setLandmarks] = useState([]);
  const [filteredLandmarks, setFilteredLandmarks] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const [nearestCave, setNearestCave] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapReady, setMapReady] = useState(false);

 useEffect(() => {
  if (!map.current || !userLocation) return;

  if (!userMarkerRef.current) {
    const el = document.createElement("div");
    el.innerHTML = `
      <div style="
        width: 18px;
        height: 18px;
        background: #3b82f6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 12px #3b82f6;
      "></div>
    `;

    userMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
  } else {
    userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
  }

}, [userLocation]);




  // Ajanta Caves center coordinates
  const AJANTA_CENTER = useMemo(() => [75.7031, 20.5519], []);

  // Fetch monuments
  useEffect(() => {
    const fetchMonuments = async () => {
      try {
        let url = `${API_URL}/monuments`;
        if (selectedMainPlace && selectedMainPlace.mainPlaceId) {
          url = `${API_URL}/mainplaces/${selectedMainPlace.mainPlaceId}/monuments`;
        }
        const res = await axios.get(url);
        console.log("API Response:", res.data); // Add this to debug
        setLandmarks(res.data);
        setFilteredLandmarks(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching monuments:", err);
        setLoading(false);
      }
    };
    fetchMonuments();
  }, [selectedMainPlace]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: AJANTA_CENTER,
      zoom: 16,
      pitch: 45,
      bearing: -10
    });

    // Add navigation controls
    map.current.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    // Add geolocation control
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocate, "top-right");

    map.current.on("load", () => {
      setMapReady(true);
    });
 
   // Demo user location (Ajanta entry)
setUserLocation({
  lat: 20.5519,
  lng: 75.7033
});
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [AJANTA_CENTER]);

  // Calculate distance between two points
  const getDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return Infinity;
    const R = 6371000; // Earth radius in meters
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, []);

const getTravelTime = (distance) => {
  if (!distance || distance === Infinity) return "…";

  const walkingSpeed = 1.2; // realistic walking speed (Ajanta = slopes)
  const minutes = Math.ceil((distance / walkingSpeed) / 60);

  if (minutes < 1) return "<1 min";
  return `${minutes} min`;
};

const drawRoute = useCallback((destination) => {
  if (!map.current || !userLocation) return;

  if (!map.current.isStyleLoaded()) {
    console.log("⏳ Map not ready yet...");
    return;
  }

  setIsNavigating(true);

  const routeData = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [
        [userLocation.lng, userLocation.lat],
        [destination.lng, destination.lat]
      ]
    }
  };

  // Remove old route safely
  if (map.current.getLayer("route-line")) {
    map.current.removeLayer("route-line");
  }
  if (map.current.getSource("route")) {
    map.current.removeSource("route");
  }

  // Add new route
  map.current.addSource("route", {
    type: "geojson",
    data: routeData
  });

  map.current.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    paint: {
      "line-color": "#22c55e",
      "line-width": 5
    }
  });

  // 🔥 BEST FIT FIX
  const bounds = new maplibregl.LngLatBounds();
  bounds.extend([userLocation.lng, userLocation.lat]);
  bounds.extend([destination.lng, destination.lat]);

  map.current.fitBounds(bounds, {
    padding: 120,
    maxZoom: 16,   // prevents over zoom
    duration: 1000
  });
}, [userLocation]);

  // Find nearest cave
  useEffect(() => {
    if (!userLocation || landmarks.length === 0) return;

    const caves = landmarks.filter((l) => l.category === "Cave");
    if (caves.length === 0) return;

    const nearest = caves.reduce((prev, curr) => {
      const d1 = getDistance(userLocation, prev.coordinates);
      const d2 = getDistance(userLocation, curr.coordinates);
      return d2 < d1 ? curr : prev;
    });

    const distance = getDistance(userLocation, nearest.coordinates);
    setNearestCave({ ...nearest, distance });
  }, [userLocation, landmarks, getDistance]);


  useEffect(() => {
if (!navigationTarget || !mapReady || !userLocation || landmarks.length === 0) return;

  // 🔥 find that place in landmarks
  const target = landmarks.find(
    (l) => l.monumentId === navigationTarget.monumentId
  );

  if (!target) {
    console.log("Target not found:", navigationTarget.monumentId);
    return;
  }

  // 🔥 select place
  setSelectedPlace(target);

  // 🔥 draw route
  drawRoute(target.coordinates);

  setIsNavigating(true);

  // 🔥 smooth camera
  map.current.flyTo({
    center: [target.coordinates.lng, target.coordinates.lat],
    zoom: 17,
    pitch: 60,
    bearing: 30,
    duration: 1000
  });

}, [navigationTarget, mapReady, userLocation, landmarks, drawRoute]);


  // Add markers to map
  useEffect(() => {
    if (!mapReady || !map.current || filteredLandmarks.length === 0) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add new markers
    filteredLandmarks.forEach((loc) => {
      if (!loc.coordinates) return;

      const el = createMarkerElement(loc.category, selectedPlace?.monumentId === loc.monumentId);

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
        .addTo(map.current);

      el.addEventListener("click", () => {
        setSelectedPlace(loc);
        map.current.flyTo({
          center: [loc.coordinates.lng, loc.coordinates.lat],
          zoom: 18,
          pitch: 60,
          duration: 1000
        });
      });

      markersRef.current[loc.monumentId] = marker;
    });
  }, [filteredLandmarks, mapReady, selectedPlace]);

  // Filter handler
  const handleFilter = (filter) => {
    setActiveFilter(filter);
    setSelectedPlace(null);

    if (filter === "all") {
      setFilteredLandmarks(landmarks);
    } else if (filter === "popular") {
      setFilteredLandmarks(landmarks.filter((l) => l.isPopular));
    } else if (filter === "nearby" && userLocation) {
      const sorted = [...landmarks].sort((a, b) => {
        return getDistance(userLocation, a.coordinates) - getDistance(userLocation, b.coordinates);
      });
      setFilteredLandmarks(sorted.slice(0, 5));
    } else {
      setFilteredLandmarks(landmarks.filter((l) => l.category === filter));
    }

    // Reset map view
    map.current?.flyTo({
      center: AJANTA_CENTER,
      zoom: 16,
      pitch: 45,
      duration: 800
    });
  };

  // Focus on monument from sidebar
  const handleSidebarClick = (place) => {
    setSelectedPlace(place);
    map.current?.flyTo({
      center: [place.coordinates.lng, place.coordinates.lat],
      zoom: 18,
      pitch: 60,
      duration: 1000
    });
  };

  const filters = [
    { id: "all", label: translations[language].all, icon: "🗺️" },
    { id: "popular", label: translations[language].popular, icon: "⭐" },
    { id: "nearby", label: translations[language].nearby, icon: "📍" },
    { id: "Cave", label: translations[language].caves, icon: "🏛️" },
    { id: "Viewpoint", label: translations[language].views, icon: "👁️" }
  ];

  return (
    <div className="h-full w-full flex bg-[#050810]">
      
      {/* Sidebar - Cave List */}
      <div className="w-80 bg-black/40 border-r border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-white italic mb-1">{translations[language].liveCaveMap}</h2>
          <p className={`text-xs font-bold ${loading ? 'text-yellow-400' : 'text-lime-400'}`}>
            {loading ? translations[language].loadingCaves : translations[language].locationsActive(filteredLandmarks.length)}
          </p>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/10">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilter(filter.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === filter.id
                    ? "bg-lime-400 text-black"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {filter.icon} {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nearest Cave Alert */}
        {nearestCave && (
          <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-lime-500/20 to-emerald-500/20 border border-lime-400/30 rounded-2xl">
            <p className="text-[10px] text-lime-400 uppercase font-black tracking-widest mb-1">
              📍 {translations[language].nearestCave}
            </p>
            <p className="text-white font-bold">{nearestCave.name}</p>
            <p className="text-slate-400 text-sm">{nearestCave.distance}m away</p>
            <button
              onClick={() => handleSidebarClick(nearestCave)}
              className="mt-2 w-full py-2 bg-lime-400 text-black rounded-lg text-sm font-bold hover:bg-lime-300 transition"
            >
              {translations[language].showOnMap}
            </button>
          </div>
        )}

        {/* Cave List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredLandmarks.map((place) => (
            <div
              key={place.monumentId}
              onClick={() => handleSidebarClick(place)}
              className={`p-4 rounded-2xl cursor-pointer transition-all ${
                selectedPlace?.monumentId === place.monumentId
                  ? "bg-lime-400/20 border border-lime-400/50"
                  : "bg-white/5 border border-transparent hover:bg-white/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  {place.category === "Cave" && "🏛️"}
                  {place.category === "Restaurant" && "🍽️"}
                  {place.category === "Viewpoint" && "👁️"}
                  {place.category === "Entry" && "🎫"}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{place.name}</p>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                    {place.shortDescription}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-1 bg-white/10 rounded-full text-slate-300">
                      {place.category}
                    </span>
                    {place.isPopular && (
                      <span className="text-[10px] px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                        ⭐ Popular
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Area */}
  <div className="flex-1 relative">

  {/* Map Container */}
  <div ref={mapContainer} className="w-full h-full" />

  {/* ✅ ADD HERE (Navigation UI) */}
  {isNavigating && selectedPlace && (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[420px] max-w-[95vw] bg-black/95 shadow-2xl rounded-2xl p-6 z-50 flex flex-col gap-3 border border-lime-400/30 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-lime-400 font-bold uppercase tracking-widest mb-1">{translations[language].navigatingTo}</p>
          <p className="text-white font-black text-xl leading-tight">{selectedPlace.name}</p>
        </div>
        <button
          onClick={() => {
            setIsNavigating(false);
            if (map.current.getLayer("route-line")) map.current.removeLayer("route-line");
            if (map.current.getSource("route")) map.current.removeSource("route");
            map.current.flyTo({
              center: [userLocation.lng, userLocation.lat],
              zoom: 16,
              pitch: 45,
              bearing: 0,
              duration: 800
            });
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-400 shadow"
        >
          {translations[language].end}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-lime-400 font-bold text-lg">
            <span>📍</span>
            <span>{(() => {
              const d = getDistance(userLocation, selectedPlace.coordinates);
              return `${d}m`;
            })()}</span>
            <span className="text-slate-400 font-normal text-base">|</span>
            <span>⏱️</span>
            <span>{(() => {
              const d = getDistance(userLocation, selectedPlace.coordinates);
              return getTravelTime(d);
            })()}</span>
          </div>
          {/* Progress bar (visual, not functional) */}
          <div className="w-full h-2 bg-white/10 rounded-full mt-3">
            <div className="h-full bg-lime-400 rounded-full transition-all" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  )}

        {/* Selected Place Popup */}
        {selectedPlace && (
          <div className="absolute bottom-6 left-6 w-80 bg-[#0c1220]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-20 overflow-hidden">
            
            {/* Image */}
            {selectedPlace.imageUrl && (
              <div className="h-40 overflow-hidden">
                <img
                  src={selectedPlace.imageUrl}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">
                    {selectedPlace.category}
                  </span>
                  <h3 className="text-white font-bold text-lg">{selectedPlace.name}</h3>
                </div>
                {selectedPlace.isPopular && (
                  <span className="text-yellow-400 text-lg">⭐</span>
                )}
              </div>

              <p className="text-slate-400 text-sm mb-4">
                {selectedPlace.shortDescription}
              </p>

              {/* Info badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPlace.timings && (
                  <span className="text-[10px] px-3 py-1 bg-white/5 rounded-full text-slate-300">
                    🕐 {selectedPlace.timings.split('(')[0]}
                  </span>
                )}
                {userLocation && selectedPlace.coordinates && (
                  <span className="text-[10px] px-3 py-1 bg-white/5 rounded-full text-slate-300">
          {(() => {
  if (!userLocation || !selectedPlace.coordinates) return "Calculating...";

  const distance = getDistance(userLocation, selectedPlace.coordinates);
  const time = getTravelTime(distance);

return `📍 ${distance}m • ⏱️ ${time}`;})()}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
onClick={() => {
  console.log("SENDING ID:", selectedPlace.monumentId);
  onSelectMonument(selectedPlace.monumentId);
}}
                  className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-100 transition flex items-center justify-center gap-2"
                >
                  <span>📖</span> View Details
                </button>
                <button
    onClick={() => {
  drawRoute(selectedPlace.coordinates);
  setIsNavigating(true);

  // Smooth camera focus
  map.current.easeTo({
    center: [userLocation.lng, userLocation.lat],
    zoom: 17,
    pitch: 60,
    bearing: 30,
    duration: 1000
  });
}}             className="w-full py-3 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition flex items-center justify-center gap-2"
                >
                  <span>🧭</span> Start Navigation
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-2xl p-4 z-10">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Legend</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-4 h-4 rounded-full bg-lime-400" /> Caves
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-4 h-4 rounded-full bg-blue-500" /> Viewpoints
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-4 h-4 rounded-full bg-red-500" /> Restaurant
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-4 h-4 rounded-full bg-purple-500" /> Entry
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="absolute top-4 right-20 bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 z-10">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{landmarks.filter(l => l.category === 'Cave').length}</p>
              <p className="text-[10px] text-slate-400 uppercase">Caves</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black text-lime-400">{landmarks.filter(l => l.isPopular).length}</p>
              <p className="text-[10px] text-slate-400 uppercase">Popular</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
