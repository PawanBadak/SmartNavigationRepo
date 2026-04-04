import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const categoryIcons = { Cave: "🏛️", Temple: "🙏", Museum: "🏺", Viewpoint: "🌄", Restaurant: "🍽️", Park: "🌿", Entry: "🚪", default: "📍" };
const markerColors = { highlight: "from-amber-500 to-orange-500", nature: "from-green-500 to-emerald-500", food: "from-red-500 to-pink-500", religious: "from-purple-500 to-violet-500", history: "from-blue-500 to-indigo-500", water: "from-cyan-500 to-teal-500", default: "from-slate-500 to-slate-600" };

const Dashboard = ({ selectedMainPlace, onSelectMonument, onSwitchTab, language = "en" }) => {
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainAudio, setMainAudio] = useState(null);
  const [isPlayingMain, setIsPlayingMain] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const t = {
    en: { explore: "Explore", audioGuide: "Audio Guide", viewMap: "View on Map", askAI: "Ask AI Guide", loading: "Loading places...", noPlaces: "No places found" },
    hi: { explore: "अन्वेषण करें", audioGuide: "ऑडियो गाइड", viewMap: "नक्शे पर देखें", askAI: "एआई से पूछें", loading: "लोड हो रहा है...", noPlaces: "कोई स्थान नहीं" },
    mr: { explore: "एक्सप्लोर करा", audioGuide: "ऑडिओ गाइड", viewMap: "नकाशावर पहा", askAI: "एआयला विचारा", loading: "लोड होत आहे...", noPlaces: "ठिकाणे सापडली नाहीत" },
  }[language] || {};

  useEffect(() => {
    if (!selectedMainPlace?.mainPlaceId) return;
    const fetchMonuments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/mainplaces/${selectedMainPlace.mainPlaceId}/monuments`);
        setMonuments(res.data || []);
      } catch { setMonuments([]); }
      finally { setLoading(false); }
    };
    fetchMonuments();
    // Track visit
    axios.post(`${API_URL}/mainplaces/${selectedMainPlace.mainPlaceId}/visit`).catch(() => {});
  }, [selectedMainPlace?.mainPlaceId]);

  const handleAudio = () => {
    if (!selectedMainPlace?.audioUrl) { alert("Audio guide not available for this location"); return; }
    if (mainAudio && isPlayingMain) { mainAudio.pause(); setIsPlayingMain(false); return; }
    if (mainAudio && !isPlayingMain) { mainAudio.play(); setIsPlayingMain(true); return; }
    const audio = new Audio(selectedMainPlace.audioUrl);
    audio.play().then(() => { setMainAudio(audio); setIsPlayingMain(true); }).catch(() => alert("Audio failed to play"));
    audio.onended = () => setIsPlayingMain(false);
  };

  const categories = ["all", ...new Set(monuments.map(m => m.category || m.markerType).filter(Boolean))];

  const filtered = monuments.filter(m => {
    const matchCat = activeFilter === "all" || m.category === activeFilter || m.markerType === activeFilter;
    const matchSearch = !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!selectedMainPlace) {
    return (
      <div className="h-full flex items-center justify-center bg-[#060b18] text-white">
        <div className="text-center px-8">
          <div className="text-7xl mb-6">🏛️</div>
          <h2 className="text-3xl font-black text-white mb-3">Choose a Destination</h2>
          <p className="text-slate-400 mb-6">Go to Home to discover amazing tourist places near you</p>
          <button onClick={() => onSwitchTab("Home")} className="px-8 py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black rounded-2xl hover:shadow-[0_0_25px_rgba(163,230,53,0.4)] transition-all">
            🏠 Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#060b18] text-white">
      {/* Hero Banner */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={selectedMainPlace.imageUrl || "https://via.placeholder.com/1200x500?text=Loading"}
          alt={selectedMainPlace.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = "https://via.placeholder.com/1200x500?text=No+Image"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060b18] via-[#060b18]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060b18]/60 to-transparent" />

        {/* Floating badge */}
        {selectedMainPlace.isPopular && (
          <div className="absolute top-5 left-5 flex items-center gap-2 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-300 text-xs font-black uppercase tracking-widest">Popular Destination</span>
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl font-black text-white mb-1 drop-shadow-lg">{selectedMainPlace.name}</h1>
          <div className="flex items-center gap-3 text-slate-300 text-sm flex-wrap">
            {selectedMainPlace.district && <span>📍 {selectedMainPlace.district}</span>}
            {selectedMainPlace.timings && <span>🕐 {selectedMainPlace.timings}</span>}
            {monuments.length > 0 && <span>🏛️ {monuments.length} places</span>}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto scrollbar-none">
        <button
          onClick={handleAudio}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${isPlayingMain ? "bg-lime-400 text-black shadow-lg shadow-lime-400/30" : "bg-white/[0.08] text-white border border-white/10 hover:border-lime-400/50 hover:bg-white/12"}`}
        >
          <span>{isPlayingMain ? "⏸" : "🎧"}</span>
          {isPlayingMain ? "Pause Guide" : t.audioGuide}
        </button>
        <button
          onClick={() => onSwitchTab("Live Map")}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-white/[0.08] text-white border border-white/10 hover:border-cyan-400/50 hover:bg-white/12 transition-all whitespace-nowrap flex-shrink-0"
        >
          🗺️ {t.viewMap}
        </button>
        <button
          onClick={() => onSwitchTab("AI Chat")}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-white/[0.08] text-white border border-white/10 hover:border-purple-400/50 hover:bg-white/12 transition-all whitespace-nowrap flex-shrink-0"
        >
          🤖 {t.askAI}
        </button>
        <button
          onClick={() => onSwitchTab("Smart Tour")}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 transition-all whitespace-nowrap flex-shrink-0"
        >
          🎯 Plan Tour
        </button>
      </div>

      {/* Description */}
      {selectedMainPlace.description && (
        <div className="px-6 pb-4">
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5">
            <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{selectedMainPlace.description}</p>
          </div>
        </div>
      )}

      {/* Info Strip */}
      <div className="px-6 pb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🕐", label: "Timings", val: selectedMainPlace.timings || "9AM–5PM" },
            { icon: "🎫", label: "Entry", val: selectedMainPlace.entryFee || "Free" },
            { icon: "⏱️", label: "Duration", val: selectedMainPlace.visitDuration ? `${selectedMainPlace.visitDuration}min` : "2–4 hrs" },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.04] border border-white/8 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-white font-bold text-xs truncate">{item.val}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monuments Section */}
      <div className="px-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white">Places to Visit</h2>
          <span className="text-slate-400 text-sm">{filtered.length} of {monuments.length}</span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places..."
            className="w-full bg-white/[0.04] border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-lime-400/50 transition"
          />
        </div>

        {/* Category Filters */}
        {categories.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                  activeFilter === cat
                    ? "bg-lime-400 text-black shadow-md shadow-lime-400/20"
                    : "bg-white/[0.05] text-slate-400 border border-white/8 hover:border-white/20 hover:text-white"
                }`}
              >
                {categoryIcons[cat] || "📍"} {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-lime-400 border-t-transparent animate-spin mb-4" />
            <p className="text-slate-400">{t.loading}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-slate-400">{t.noPlaces}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((m, idx) => {
              const grad = markerColors[m.markerType] || markerColors.default;
              return (
                <div
                  key={m.monumentId || idx}
                  onClick={() => onSelectMonument(m.monumentId)}
                  className="group flex items-center gap-4 bg-white/[0.04] border border-white/8 hover:border-lime-400/40 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-lime-500/10 hover:scale-[1.01]"
                >
                  {/* Image or Icon */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { e.target.parentNode.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center text-2xl">${categoryIcons[m.category] || "📍"}</div>`; }} />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center text-2xl`}>
                        {categoryIcons[m.category] || "📍"}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-bold group-hover:text-lime-300 transition-colors leading-tight">{m.name}</h3>
                      {m.isPopular && <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold flex-shrink-0">⭐ Popular</span>}
                    </div>
                    <p className="text-slate-500 text-xs mt-1">{m.category || m.markerType}</p>
                    {m.shortDescription && (
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">{m.shortDescription}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {m.timings && <span className="text-xs text-slate-400">🕐 {m.timings}</span>}
                      {m.entryFee && <span className="text-xs text-amber-400">🎫 {m.entryFee}</span>}
                      {m.visitDuration && <span className="text-xs text-cyan-400">⏱ {m.visitDuration}min</span>}
                    </div>
                  </div>

                  <div className="text-slate-600 group-hover:text-lime-400 transition-colors flex-shrink-0">
                    <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
