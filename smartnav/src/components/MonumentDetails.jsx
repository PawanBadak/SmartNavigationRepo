import React, { useEffect, useState } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";


const API_URL = "https://smartnavigationrepo.onrender.com/api";

const MonumentDetail = ({ id, onBack, onNavigate, onStartNavigation }) => {
  const [monument, setMonument] = useState(null);
  const [nearbyData, setNearbyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  
const [userLocation] = useState({
  lat: 20.5525,
  lng: 75.7033,
});


  useEffect(() => {
    const fetchMonument = async () => {
      try {
        const res = await axios.get(`${API_URL}/monuments/${id}`);
        setMonument(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMonument();
  }, [id]);

  useEffect(() => {
  const fetchNearby = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/monuments/nearby/${id}`
      );
      setNearbyData(res.data);
    } catch (err) {
      console.error("Nearby error:", err);
    }
  };

  if (id) fetchNearby();
}, [id]);

// 🔥 AUDIO GUIDE HANDLER (FINAL CLEAN VERSION)
const handlePlayAudio = () => {
  if (!monument?.audioUrl) {
    alert("Audio guide not available");
    return;
  }

  console.log("AUDIO URL:", monument.audioUrl);

  // 🔥 If audio already playing → pause
  if (audio && isPlaying) {
    audio.pause();
    setIsPlaying(false);
    return;
  }

  // 🔥 If audio exists but paused → resume
  if (audio && !isPlaying) {
    audio.play();
    setIsPlaying(true);
    return;
  }

  // 🔥 First time play
  const newAudio = new Audio(monument.audioUrl);

  newAudio.play()
    .then(() => {
      setAudio(newAudio);
      setIsPlaying(true);
    })
    .catch((err) => {
      console.error("Audio play error:", err);
      alert("Audio failed to play");
    });

  newAudio.onended = () => setIsPlaying(false);
};
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!monument) return null;

  return (
    <div className="h-full overflow-y-auto bg-[#050810] text-white">

      {/* 🔥 IMAGE SLIDER */}
      <div className="relative h-80">
        <Swiper spaceBetween={10} slidesPerView={1}>
       {(monument.images && monument.images.length > 0
  ? monument.images
  : monument.imageUrl
  ? [monument.imageUrl]
  : ["https://via.placeholder.com/800x400?text=No+Image"]
).map((img, i) => (
  <SwiperSlide key={i}>
    <img
      src={img}
      className="w-full h-80 object-cover"
      alt=""
      onError={(e) => {
        e.target.src = "https://via.placeholder.com/800x400?text=Image+Error";
      }}
    />
  </SwiperSlide>
))}
       
        </Swiper>

        <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />

       <button
  onClick={onBack}
  className="absolute top-5 left-5 z-50 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-white"
>
  ← Back
</button>

        <div className="absolute bottom-5 left-5">
          <h1 className="text-3xl font-bold">{monument.name}</h1>
          <p className="text-slate-300">{monument.shortDescription}</p>
        </div>
      </div>

      {/* 🔥 ACTION BUTTONS */}
    {/* 🔥 CLEANER ACTION BAR */}
<div className="px-5 py-4 flex items-center justify-between bg-white/5 border-b border-white/5">
  <div className="flex gap-4">
    {/* Small, elegant Audio button */}
    <button
      onClick={handlePlayAudio}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
        isPlaying ? "bg-lime-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      <span>{isPlaying ? "⏸️" : "🎧"}</span>
      <span className="text-xs uppercase tracking-widest">{isPlaying ? "Playing" : "Listen Guide"}</span>
    </button>
  </div>

  {/* Only show navigation here if you really want a small button, otherwise leave it empty */}
<button
  onClick={() => onStartNavigation(monument)} // start navigation for current monument
    className="text-lime-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition"
  >
    📍 View on Map
  </button>
</div>

      {/* 🔥 TABS */}
      <div className="flex px-5 border-b border-white/10">
        {["overview", "history", "visit"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 capitalize ${
              activeTab === tab
                ? "text-lime-400 border-b-2 border-lime-400"
                : "text-slate-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 🔥 CONTENT */}
      <div className="p-5 space-y-6">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div className="bg-white/5 p-5 rounded-2xl">

              <h3 className="font-bold mb-2">📖 About</h3>
              {nearbyData && (
  <div className="bg-gradient-to-r from-lime-400/20 to-emerald-400/10 border border-lime-400/30 rounded-2xl p-5">

    {/* CURRENT LOCATION */}
    <p className="text-lime-400 font-bold text-lg mb-3">
      🟢 You are at {nearbyData.current}
    </p>

  {nearbyData.next && (
  <div className="mb-5">

    <p className="text-white font-bold mb-2">
      🚀 Recommended Next Stop
    </p>

    <div className="bg-lime-400/10 border border-lime-400/40 p-4 rounded-2xl">

   {/* find the "Go →" or "Navigate →" button section */}
<div className="flex justify-between items-center">
  <div>
    <p className="text-lime-400 text-lg font-bold">
      {nearbyData.next.name}
    </p>
    <p className="text-slate-300 text-sm">
      {nearbyData.next.distance} meters away
    </p>
  </div>

  <button
    // 🔥 CHANGE THIS LINE FROM onNavigate TO onStartNavigation
    onClick={() => onStartNavigation(nearbyData.next)}
    className="bg-lime-400 text-black px-4 py-2 rounded-xl font-bold hover:scale-105 transition"
  >
    Navigate →
  </button>
</div>

    </div>
  </div>
)}

    {/* NEARBY LIST */}
    <div>
      <p className="text-white font-bold mb-2">📍 Nearby Places</p>
{nearbyData.nearby.map((place, i) => (
  <div
    key={i} 
    onClick={() => onStartNavigation(place)}// 🔥 START NAVIGATION
    className="flex justify-between items-center text-slate-300 text-sm py-2 px-2 rounded-xl hover:bg-white/10 cursor-pointer transition"
  >
    <span>{place.name}</span>

    <div className="flex items-center gap-2">
      <span>{place.distance}m</span>
      <span className="text-lime-400">→</span>
    </div>
  </div>
))}
    </div>

  </div>
)}
              <p className="text-slate-300">{monument.description}</p>
           
            </div>

            {/* Highlights */}
            {monument.highlights && (
              <div className="bg-white/5 p-5 rounded-2xl">
                <h3 className="font-bold mb-3">✨ Highlights</h3>
                {monument.highlights.map((h, i) => (
                  <p key={i} className="text-slate-300">• {h}</p>
                ))}
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 p-4 rounded-xl text-center">
                🕐<br />{monument.timings || "9AM-5PM"}
              </div>
              <div className="bg-white/5 p-4 rounded-xl text-center">
                🎫<br />{monument.entryFee || "₹40"}
              </div>
              <div className="bg-white/5 p-4 rounded-xl text-center">
                ⏱️<br />30-45 min
              </div>
            </div>
          </>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="bg-white/5 p-5 rounded-2xl">
            <h3 className="font-bold mb-3">📜 History</h3>
      <p className="text-slate-300">
  {monument.history || "No historical information available."}
</p>
          </div>
        )}

        {/* VISIT */}
        {activeTab === "visit" && (
          <>
            <div className="bg-white/5 p-5 rounded-2xl">
              <h3 className="font-bold mb-2">📍 Location</h3>
             <p className="text-slate-300 mb-2">
  📍 Cave Location: {monument.coordinates.lat}, {monument.coordinates.lng}
</p>

{userLocation && (
  <p className="text-lime-400 text-sm">
    🟢 You are here (simulated): {userLocation.lat}, {userLocation.lng}
  </p>
)}
            </div>

            {/* 🔥 MINI MAP */}
            <iframe
              title={`Monument location: ${monument.name}`}
              width="100%"
              height="200"
              className="rounded-xl"
              src={`https://maps.google.com/maps?q=${monument.coordinates.lat},${monument.coordinates.lng}&z=15&output=embed`}
            />
          </>
        )}

      </div>
    </div>
  );
};

export default MonumentDetail;