import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import axios from "axios";
import "maplibre-gl/dist/maplibre-gl.css";

const API_URL = "http://localhost:5000/api";
const ROUTE_PROFILE = {
  walk: "walking",
  bike: "cycling",
  car: "driving"
};

const markerVisuals = {
  religious: { bg: "#f59e0b", icon: "🛕" },
  food: { bg: "#ef4444", icon: "🍽️" },
  nature: { bg: "#0ea5e9", icon: "🌊" },
  history: { bg: "#a3e635", icon: "🏛️" },
  stay: { bg: "#8b5cf6", icon: "🛏️" },
  entry: { bg: "#3b82f6", icon: "🚪" },
  washroom: { bg: "#64748b", icon: "🚻" },
  water: { bg: "#06b6d4", icon: "🚰" },
  parking: { bg: "#f97316", icon: "🚗" },
  current: { bg: "#22c55e", icon: "📍" },
  highlight: { bg: "#eab308", icon: "⭐" },
  Cave: { bg: "#a3e635", icon: "🏛️" },
  Temple: { bg: "#f59e0b", icon: "🛕" },
  Restaurant: { bg: "#ef4444", icon: "🍽️" },
  Viewpoint: { bg: "#3b82f6", icon: "👁️" },
  Entry: { bg: "#8b5cf6", icon: "🎫" },
  Utility: { bg: "#6b7280", icon: "🔧" },
  'Heritage Site': { bg: "#a3e635", icon: "🏛️" },
  Museum: { bg: "#f59e0b", icon: "🏛️" },
  Park: { bg: "#10b981", icon: "🌳" },
  Fort: { bg: "#ef4444", icon: "🏰" }
};

const getMarkerVisual = (type) => markerVisuals[type] || markerVisuals.Cave;

// Cave marker SVG
const createMarkerElement = (markerType, isSelected = false) => {
  const el = document.createElement("div");
  el.className = "custom-marker";
  
  const config = getMarkerVisual(markerType);
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
    liveCaveMap: "Live Map",
    locationsActive: (n) => `${n} locations active`,
    loadingCaves: "Loading locations...",
    all: "All",
    popular: "Popular",
    nearby: "Nearby",
    caves: "Caves",
    views: "Views",
    nearestCave: "Nearest Location",
    showOnMap: "Show on Map",
    navigatingTo: "Navigating to",
    end: "End",
    calculating: "Calculating...",
    readyToScan: "Ready to scan QR",
    scanning: "Scanning..."
  },
  hi: {
    liveCaveMap: "लाइव मानचित्र",
    locationsActive: (n) => `${n} स्थान सक्रिय हैं`,
    loadingCaves: "स्थान लोड हो रहे हैं...",
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

const LiveMap = ({ onSelectMonument, selectedMonumentId, navigationTarget, language = "en", selectedMainPlace, currentCity, onSelectMainPlace }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const hasCenteredOnUserRef = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const [landmarks, setLandmarks] = useState([]);
  const [filteredLandmarks, setFilteredLandmarks] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const [nearestCave, setNearestCave] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapReady, setMapReady] = useState(false);
  const [isShowingMainPlaces, setIsShowingMainPlaces] = useState(false);
  const hasAutoSelectedMainRef = useRef(false);
  const [selectedTravelMode, setSelectedTravelMode] = useState("car");
  const [routeEstimates, setRouteEstimates] = useState({});

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
  const selectedMainPlaceCenter = useMemo(() => {
    if (!selectedMainPlace?.coordinates) return null;
    return [selectedMainPlace.coordinates.lng, selectedMainPlace.coordinates.lat];
  }, [selectedMainPlace]);

  // Fetch monuments or main places
  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = `${API_URL}/monuments`;
        let isMainPlaces = false;
        if (selectedMainPlace && selectedMainPlace.mainPlaceId) {
          url = `${API_URL}/mainplaces/${selectedMainPlace.mainPlaceId}/monuments`;
        } else if (currentCity && !selectedMainPlace) {
          // Show main places for the city
          url = `${API_URL}/mainplaces?city=${encodeURIComponent(currentCity)}`;
          isMainPlaces = true;
        }
        const res = await axios.get(url);
        console.log("API Response:", res.data);
        if (selectedMainPlace && selectedMainPlace.mainPlaceId) {
          const mainPlaceMarker = {
            monumentId: selectedMainPlace.mainPlaceId,
            name: selectedMainPlace.name,
            coordinates: selectedMainPlace.coordinates,
            category: selectedMainPlace.category || "Heritage Site",
            shortDescription: selectedMainPlace.shortDescription || selectedMainPlace.description,
            description: selectedMainPlace.description,
            imageUrl: selectedMainPlace.imageUrl,
            timings: selectedMainPlace.timings,
            entryFee: selectedMainPlace.entryFee,
            markerType: "highlight",
            isMainPlaceMarker: true,
            isPopular: true
          };
          const subPlaces = Array.isArray(res.data) ? res.data : [];
          const merged = [mainPlaceMarker, ...subPlaces];
          setLandmarks(merged);
          setFilteredLandmarks(merged);
          setIsShowingMainPlaces(false);
          if (!hasAutoSelectedMainRef.current) {
            setSelectedPlace(mainPlaceMarker);
            hasAutoSelectedMainRef.current = true;
          }
        } else if (isMainPlaces) {
          // Transform main places to landmark format
          const transformed = res.data.map(place => ({
            monumentId: place.mainPlaceId,
            name: place.name,
            coordinates: place.coordinates,
            category: place.category || 'Heritage Site',
            description: place.shortDescription,
            shortDescription: place.shortDescription,
            isMainPlaceMarker: true,
            markerType: place.markerType || "highlight"
          }));
          setLandmarks(transformed);
          setFilteredLandmarks(transformed);
          setIsShowingMainPlaces(true);
        } else {
          setLandmarks(res.data);
          setFilteredLandmarks(res.data);
          setIsShowingMainPlaces(false);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMainPlace, currentCity]);

  useEffect(() => {
    hasAutoSelectedMainRef.current = false;
  }, [selectedMainPlace?.mainPlaceId]);

  useEffect(() => {
    if (!mapReady || !map.current || !selectedMainPlaceCenter) return;

    map.current.flyTo({
      center: selectedMainPlaceCenter,
      zoom: 16,
      pitch: 45,
      bearing: 0,
      duration: 900
    });
  }, [mapReady, selectedMainPlaceCenter]);

  // Use live GPS updates for routing start point and blue-dot marker.
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported. Falling back to Ajanta center.");
      setUserLocation({ lat: 20.5519, lng: 75.7033 });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const liveLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setUserLocation(liveLocation);

        if (
          map.current &&
          !selectedMainPlace &&
          !hasCenteredOnUserRef.current
        ) {
          map.current.flyTo({
            center: [liveLocation.lng, liveLocation.lat],
            zoom: 15,
            pitch: 35,
            bearing: 0,
            duration: 900
          });
          hasCenteredOnUserRef.current = true;
        }
      },
      (error) => {
        console.error("Live location error:", error.message);

        // OLD STATIC LOCATION LOGIC (commented for reference):
        // setUserLocation({ lat: 20.5519, lng: 75.7033 });

        // NEW FALLBACK: if permission fails, keep map functional with Ajanta fallback.
        setUserLocation({ lat: 20.5519, lng: 75.7033 });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
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

    // OLD STATIC LOCATION LOGIC REMOVED:
    // setUserLocation({ lat: 20.5519, lng: 75.7033 });

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

  const formatDistance = useCallback((distanceMeters) => {
    if (!distanceMeters || distanceMeters === Infinity) return "…";
    if (distanceMeters >= 1000) return `${(distanceMeters / 1000).toFixed(1)} km`;
    return `${distanceMeters} m`;
  }, []);

  const formatDurationFromMinutes = useCallback((minutes) => {
    if (!minutes || minutes < 1) return "<1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (rem === 0) return `${hours} hr`;
    return `${hours} hr ${rem} min`;
  }, []);

  const travelModes = useMemo(() => ([
    { id: "walk", label: "Walk", speedMps: 1.2, costPerKm: 0 },
    { id: "bike", label: "Bike", speedMps: 5.5, costPerKm: 2.5 },
    { id: "car", label: "Car", speedMps: 13.9, costPerKm: 8 }
  ]), []);

  const getCostEffectiveSuggestion = useCallback((distanceMeters) => {
    if (!distanceMeters || distanceMeters === Infinity) return "Waiting for location...";
    if (distanceMeters < 1500) return "Best budget option: Walk (zero cost for short distance).";
    if (distanceMeters < 15000) return "Best budget option: Bike (good speed with low cost).";
    return "Best practical option: Car for long distance; share ride to reduce cost.";
  }, []);

  const fetchRouteFromApi = useCallback(async (start, destination, modeId) => {
    const profile = ROUTE_PROFILE[modeId] || "walking";
    const routeUrl = `https://router.project-osrm.org/route/v1/${profile}/${start.lng},${start.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=false&steps=false`;

    const response = await axios.get(routeUrl);
    const route = response.data?.routes?.[0];
    if (!route) return null;

    return {
      coordinates: route.geometry.coordinates,
      distanceMeters: Math.round(route.distance),
      durationMinutes: Math.max(1, Math.ceil(route.duration / 60))
    };
  }, []);

  const clearRouteLayer = useCallback((mapInstance) => {
    if (!mapInstance) return;
    if (mapInstance.getLayer("route-line")) mapInstance.removeLayer("route-line");
    if (mapInstance.getSource("route")) mapInstance.removeSource("route");
  }, []);

  const drawRoute = useCallback(async (destination, modeId = selectedTravelMode) => {
    const mapInstance = map.current;
    if (!mapInstance || !userLocation) return;

    if (!mapInstance.isStyleLoaded()) {
      console.log("⏳ Map not ready yet...");
      return;
    }

    setIsNavigating(true);

    const fallbackDistance = getDistance(userLocation, destination);
    const modeConfig = travelModes.find((mode) => mode.id === modeId) || travelModes[0];

    let coordinates = [
      [userLocation.lng, userLocation.lat],
      [destination.lng, destination.lat]
    ];

    let distanceMeters = fallbackDistance;
    let durationMinutes = Math.max(1, Math.ceil(fallbackDistance / modeConfig.speedMps / 60));

    try {
      const route = await fetchRouteFromApi(userLocation, destination, modeId);
      if (route) {
        coordinates = route.coordinates;
        distanceMeters = route.distanceMeters;
        durationMinutes = route.durationMinutes;
      }
    } catch (error) {
      console.error("Route API error, using straight-line fallback:", error.message);
    }

    // drawRoute is async; map can be removed while waiting for API response.
    if (!map.current || map.current !== mapInstance || !mapInstance.isStyleLoaded()) return;

    const routeData = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates
      }
    };

    clearRouteLayer(mapInstance);

    mapInstance.addSource("route", {
      type: "geojson",
      data: routeData
    });

    mapInstance.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#22c55e",
        "line-width": 5
      }
    });

    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
    coordinates.forEach((point) => bounds.extend(point));

    mapInstance.fitBounds(bounds, {
      padding: 120,
      maxZoom: 16,
      duration: 1000
    });

    setRouteEstimates((prev) => ({
      ...prev,
      [modeId]: { distanceMeters, durationMinutes }
    }));
  }, [userLocation, selectedTravelMode, fetchRouteFromApi, getDistance, travelModes, clearRouteLayer]);

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
  drawRoute(target.coordinates, selectedTravelMode);

  setIsNavigating(true);

  // 🔥 smooth camera
  map.current?.flyTo({
    center: [target.coordinates.lng, target.coordinates.lat],
    zoom: 17,
    pitch: 60,
    bearing: 30,
    duration: 1000
  });

}, [navigationTarget, mapReady, userLocation, landmarks, drawRoute, selectedTravelMode]);

  useEffect(() => {
    let cancelled = false;

    const loadRouteEstimates = async () => {
      if (!selectedPlace?.coordinates || !userLocation) {
        setRouteEstimates({});
        return;
      }

      const results = await Promise.all(
        travelModes.map(async (mode) => {
          const directDistance = getDistance(userLocation, selectedPlace.coordinates);
          let distanceMeters = directDistance;
          let durationMinutes = Math.max(1, Math.ceil(directDistance / mode.speedMps / 60));

          try {
            const route = await fetchRouteFromApi(userLocation, selectedPlace.coordinates, mode.id);
            if (route) {
              distanceMeters = route.distanceMeters;
              durationMinutes = route.durationMinutes;
            }
          } catch (error) {
            console.error(`Failed ${mode.id} route estimate:`, error.message);
          }

          return [mode.id, { distanceMeters, durationMinutes }];
        })
      );

      if (!cancelled) {
        setRouteEstimates(Object.fromEntries(results));
      }
    };

    loadRouteEstimates();
    return () => {
      cancelled = true;
    };
  }, [selectedPlace, userLocation, travelModes, getDistance, fetchRouteFromApi]);

  useEffect(() => {
    if (!isNavigating || !selectedPlace?.coordinates || !mapReady || !userLocation) return;
    drawRoute(selectedPlace.coordinates, selectedTravelMode);
  }, [selectedTravelMode, isNavigating, selectedPlace, mapReady, userLocation, drawRoute]);


  // Add markers to map
  useEffect(() => {
    if (!mapReady || !map.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    if (filteredLandmarks.length === 0) return;

    // Add new markers
    filteredLandmarks.forEach((loc) => {
      if (!loc.coordinates) return;

      const el = createMarkerElement(loc.markerType || loc.category, selectedPlace?.monumentId === loc.monumentId);

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
    const resetCenter = selectedMainPlaceCenter || (userLocation ? [userLocation.lng, userLocation.lat] : AJANTA_CENTER);
    map.current?.flyTo({
      center: resetCenter,
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

  const showEmptyMainPlaceState = selectedMainPlace && filteredLandmarks.length === 0;
  const navigationModes = useMemo(() => {
    if (!selectedPlace?.coordinates || !userLocation) return [];

    const directDistance = getDistance(userLocation, selectedPlace.coordinates);
    const carRouteDistance = routeEstimates.car?.distanceMeters;
    const carRouteDuration = routeEstimates.car?.durationMinutes;

    return travelModes.map((mode) => {
      const routeStats = routeEstimates[mode.id];
      const distanceMeters = routeStats?.distanceMeters ?? carRouteDistance ?? directDistance;

      // Keep car ETA route-based; compute walk/bike ETA from distance to avoid unrealistic identical times.
      let minutes;
      if (mode.id === "car") {
        minutes = routeStats?.durationMinutes ?? carRouteDuration ?? Math.max(1, Math.ceil(distanceMeters / mode.speedMps / 60));
      } else {
        minutes = Math.max(1, Math.ceil(distanceMeters / mode.speedMps / 60));
      }

      const estimatedCost = Math.round((distanceMeters / 1000) * mode.costPerKm);
      return {
        ...mode,
        distanceMeters,
        minutes,
        durationText: formatDurationFromMinutes(minutes),
        distanceText: formatDistance(distanceMeters),
        estimatedCost,
        costText: estimatedCost === 0 ? "Free" : `~Rs ${estimatedCost}`
      };
    });
  }, [selectedPlace, userLocation, getDistance, travelModes, routeEstimates, formatDurationFromMinutes, formatDistance]);

  const currentModeEstimate = navigationModes.find((mode) => mode.id === selectedTravelMode) || navigationModes[0];
  const navigationDistance = currentModeEstimate?.distanceMeters ?? Infinity;
  const bestTravelSuggestion = useMemo(
    () => getCostEffectiveSuggestion(navigationDistance),
    [getCostEffectiveSuggestion, navigationDistance]
  );

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
            <p className="text-slate-400 text-sm">{formatDistance(nearestCave.distance)} away</p>
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
          {showEmptyMainPlaceState && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-bold text-white mb-1">{selectedMainPlace.name}</p>
              <p>No sub-places have been added for this main place yet.</p>
              <p className="mt-2 text-slate-400">The map is centered here so you can still view the location.</p>
            </div>
          )}
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
                  {getMarkerVisual(place.markerType || place.category).icon}
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
            const mapInstance = map.current;
            if (!mapInstance) return;
            clearRouteLayer(mapInstance);
            const safeCenter = userLocation
              ? [userLocation.lng, userLocation.lat]
              : (selectedPlace?.coordinates
                ? [selectedPlace.coordinates.lng, selectedPlace.coordinates.lat]
                : AJANTA_CENTER);
            mapInstance.flyTo({
              center: safeCenter,
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
            <span>{formatDistance(navigationDistance)}</span>
            <span className="text-slate-400 font-normal text-base">|</span>
            <span>⏱️</span>
            <span>{currentModeEstimate?.durationText || "..."}</span>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {navigationModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedTravelMode(mode.id)}
                className={`text-left rounded-xl px-2 py-2 border transition ${
                  selectedTravelMode === mode.id
                    ? "bg-lime-500/20 border-lime-400 text-white"
                    : "bg-white/5 border-white/10 text-slate-200 hover:border-lime-300/60"
                }`}
              >
                <p className="font-bold text-lime-300">{mode.label}</p>
                <p>{mode.durationText}</p>
                <p className="text-slate-400">{mode.distanceText}</p>
                <p className="text-slate-400">{mode.costText}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-emerald-300 mt-2">{bestTravelSuggestion}</p>
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
  if (!currentModeEstimate) return "Calculating...";
  return `📍 ${currentModeEstimate.distanceText} • ⏱️ ${currentModeEstimate.durationText}`;
})()}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
onClick={() => {
  console.log("SENDING ID:", selectedPlace.monumentId);
  if (selectedPlace.isMainPlaceMarker) {
    if (onSelectMainPlace) {
      onSelectMainPlace({
        mainPlaceId: selectedPlace.monumentId,
        name: selectedPlace.name,
        coordinates: selectedPlace.coordinates,
        category: selectedPlace.category,
        shortDescription: selectedPlace.shortDescription
      });
    }
    return;
  }

  if (isShowingMainPlaces) {
    // Find the original main place data
    const mainPlace = landmarks.find(l => l.monumentId === selectedPlace.monumentId);
    if (mainPlace && onSelectMainPlace) {
      onSelectMainPlace({
        mainPlaceId: mainPlace.monumentId,
        name: mainPlace.name,
        coordinates: mainPlace.coordinates,
        category: mainPlace.category,
        shortDescription: mainPlace.description
      });
    }
  } else {
    onSelectMonument(selectedPlace.monumentId);
  }
}}
                  className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-100 transition flex items-center justify-center gap-2"
                >
                  <span>📖</span> View Details
                </button>
                <button
    onClick={() => {
  if (!map.current || !userLocation || !selectedPlace?.coordinates) {
    console.warn("Waiting for user location before starting navigation...");
    return;
  }

  drawRoute(selectedPlace.coordinates, selectedTravelMode);
  setIsNavigating(true);

  // Smooth camera focus
  map.current.easeTo({
    center: [userLocation.lng, userLocation.lat],
    zoom: 17,
    pitch: 60,
    bearing: 30,
    duration: 1000
  });
}}             disabled={!userLocation}
                className={`w-full py-3 text-black rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                  userLocation ? "bg-lime-400 hover:bg-lime-300" : "bg-slate-500 cursor-not-allowed"
                }`}
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
