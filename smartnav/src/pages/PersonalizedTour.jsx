import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const INTERESTS = [
  { id: "history", label: "History", icon: "🏛️", desc: "Ancient sites & caves", color: "from-amber-600/30 to-yellow-600/20", border: "border-amber-500/50", glow: "shadow-amber-500/30" },
  { id: "religious", label: "Religious", icon: "🙏", desc: "Temples & shrines", color: "from-orange-600/30 to-red-600/20", border: "border-orange-500/50", glow: "shadow-orange-500/30" },
  { id: "photography", label: "Photography", icon: "📸", desc: "Scenic viewpoints", color: "from-pink-600/30 to-rose-600/20", border: "border-pink-500/50", glow: "shadow-pink-500/30" },
  { id: "food", label: "Food", icon: "🍔", desc: "Local cuisine", color: "from-green-600/30 to-emerald-600/20", border: "border-green-500/50", glow: "shadow-green-500/30" },
  { id: "nature", label: "Nature", icon: "🌿", desc: "Parks & rivers", color: "from-teal-600/30 to-cyan-600/20", border: "border-teal-500/50", glow: "shadow-teal-500/30" },
  { id: "adventure", label: "Adventure", icon: "🧗", desc: "Trekking & climbing", color: "from-blue-600/30 to-indigo-600/20", border: "border-blue-500/50", glow: "shadow-blue-500/30" },
  { id: "culture", label: "Culture", icon: "🎭", desc: "Art & music", color: "from-purple-600/30 to-violet-600/20", border: "border-purple-500/50", glow: "shadow-purple-500/30" },
];

const PersonalizedTour = ({ onSelectMonument, onSwitchTab, selectedPlace }) => {
  const [selectedInterests, setSelectedInterests] = useState(
    JSON.parse(localStorage.getItem("userInterests") || "[]")
  );
  const [availableHours, setAvailableHours] = useState(3);
  const [budget, setBudget] = useState("moderate");
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [step, setStep] = useState(1); // 1=interests, 2=settings, 3=results

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setError("");
  };

  const generateTour = async () => {
    if (selectedInterests.length === 0) {
      setError("Please pick at least one interest to continue.");
      return;
    }
    setError("");
    setLoading(true);
    localStorage.setItem("userInterests", JSON.stringify(selectedInterests));
    try {
      const res = await axios.post(`${API_URL}/tour/recommend`, {
        interests: selectedInterests,
        availableHours,
        budget,
        mainPlaceId: selectedPlace?.mainPlaceId || null,
      });
      if (!res.data?.itinerary?.length) {
        // Fallback: fetch all monuments if no matches
        const fallbackRes = await axios.post(`${API_URL}/tour/recommend`, {
          interests: [],
          availableHours,
          budget,
          mainPlaceId: selectedPlace?.mainPlaceId || null,
        });
        setItinerary(fallbackRes.data);
      } else {
        setItinerary(res.data);
      }
      setStep(3);
    } catch (err) {
      setError("Could not generate tour. Please ensure the backend server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const saveItinerary = () => {
    if (!itinerary) return;
    const itin = {
      id: Date.now(),
      name: `Smart Tour – ${new Date().toLocaleDateString()}`,
      places: itinerary.itinerary,
      totalTime: itinerary.totalTimeMinutes,
      totalCost: itinerary.estimatedCost,
      interests: selectedInterests,
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("savedItineraries") || "[]");
    existing.push(itin);
    localStorage.setItem("savedItineraries", JSON.stringify(existing));

    // Also save to currentTour for the TourPlanner
    const tourStops = itinerary.itinerary.map(stop => ({
      ...stop,
      monumentId: stop.monumentId,
    }));
    localStorage.setItem("currentTour", JSON.stringify(tourStops));

    const userId = localStorage.getItem("userId");
    if (userId) {
      axios.post(`${API_URL}/users/${userId}/itineraries`, itin).catch(() => {});
    }
    setSavedMsg("✅ Tour saved to My Tour!");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const startTourInMap = () => {
    if (!itinerary?.itinerary?.length) return;
    // Save itinerary to TourPlanner storage
    localStorage.setItem("currentTour", JSON.stringify(itinerary.itinerary));
    onSwitchTab("My Tour"); // ← FIXED: correct tab name
  };

  const formatTime = (mins) => {
    if (!mins) return "–";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const timeLabel = availableHours <= 2 ? "Quick Visit" : availableHours <= 4 ? "Half-Day Tour" : availableHours <= 8 ? "Full-Day Tour" : "Multi-Day Trip";

  return (
    <div className="h-full overflow-y-auto bg-[#060b18] text-white relative">
      {/* Ambient glow backgrounds */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 left-20 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="relative px-8 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/30">
            🎯
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Smart Tour Planner</h1>
            <p className="text-slate-400 text-sm">AI-powered personalized itinerary for you</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= s ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/30" : "bg-white/10 text-slate-500"
              }`}>
                {s < step ? "✓" : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 w-10 rounded ${step > s ? "bg-cyan-400" : "bg-white/10"}`} />}
            </div>
          ))}
          <span className="ml-2 text-slate-400 text-xs">{step === 1 ? "Choose Interests" : step === 2 ? "Set Preferences" : "Your Itinerary"}</span>
        </div>
      </div>

      <div className="px-8 pb-16 space-y-6">
        {/* STEP 1: Interest Selection */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">What excites you most?</h2>
              <p className="text-slate-400 text-sm">Select all that apply — we'll build around your passions</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`relative p-4 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                      isSelected
                        ? `bg-gradient-to-br ${interest.color} ${interest.border} shadow-lg ${interest.glow}`
                        : "bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white text-xs font-black">✓</span>
                      </div>
                    )}
                    <div className="text-3xl mb-2">{interest.icon}</div>
                    <p className={`font-bold text-sm ${isSelected ? "text-white" : "text-slate-300"}`}>{interest.label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{interest.desc}</p>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={() => {
                if (selectedInterests.length === 0) { setError("Please pick at least one interest."); return; }
                setError(""); setStep(2);
              }}
              className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-[1.01]"
            >
              Continue → {selectedInterests.length > 0 && `(${selectedInterests.length} selected)`}
            </button>
          </div>
        )}

        {/* STEP 2: Time & Budget */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">How much time do you have?</h2>
              <p className="text-slate-400 text-sm">We'll pack the best stops into your schedule</p>
            </div>

            {/* Time Slider */}
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-lg">{availableHours} Hour{availableHours !== 1 ? "s" : ""}</p>
                  <p className="text-cyan-400 text-sm font-bold">{timeLabel}</p>
                </div>
                <div className="text-4xl">
                  {availableHours <= 2 ? "⚡" : availableHours <= 4 ? "🕐" : availableHours <= 8 ? "☀️" : "🌟"}
                </div>
              </div>
              <input
                type="range" min={1} max={12} value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                className="w-full h-2 rounded-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>1h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span>
              </div>
            </div>

            {/* Budget */}
            <div>
              <p className="text-white font-bold mb-3">💰 Budget Preference</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "budget", label: "Budget", icon: "💚", desc: "Free – ₹200", bg: "from-green-600/30 to-emerald-600/20", border: "border-green-500/50" },
                  { id: "moderate", label: "Moderate", icon: "💛", desc: "₹200 – ₹1000", bg: "from-yellow-600/30 to-amber-600/20", border: "border-yellow-500/50" },
                  { id: "luxury", label: "Luxury", icon: "💎", desc: "₹1000+", bg: "from-purple-600/30 to-violet-600/20", border: "border-purple-500/50" },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBudget(b.id)}
                    className={`p-4 rounded-2xl border text-center transition-all duration-200 hover:scale-[1.03] ${
                      budget === b.id
                        ? `bg-gradient-to-br ${b.bg} ${b.border} shadow-lg`
                        : "bg-white/[0.03] border-white/8 hover:border-white/20"
                    }`}
                  >
                    <div className="text-3xl mb-2">{b.icon}</div>
                    <p className={`font-bold text-sm ${budget === b.id ? "text-white" : "text-slate-300"}`}>{b.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected interests summary */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Your Interests</p>
              <div className="flex flex-wrap gap-2">
                {selectedInterests.map(id => {
                  const interest = INTERESTS.find(i => i.id === id);
                  return (
                    <span key={id} className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-white text-xs font-bold">
                      {interest?.icon} {interest?.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 rounded-2xl font-bold bg-white/[0.05] text-slate-300 border border-white/10 hover:bg-white/10 transition"
              >
                ← Back
              </button>
              <button
                onClick={generateTour}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Building your tour...
                  </span>
                ) : "🎯 Generate My Tour Plan"}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 3 && itinerary && (
          <div className="space-y-5">
            {/* Success header */}
            <div className="relative bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-purple-900/20 border border-cyan-500/30 rounded-2xl p-6 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/10 rounded-full blur-2xl" />
              <h3 className="text-2xl font-black text-white mb-1 relative">✨ Your Perfect Tour</h3>
              <p className="text-slate-300 text-sm relative mb-4">Curated for your interests & schedule</p>
              <div className="grid grid-cols-3 gap-4 relative">
                {[
                  { label: "Stops", value: itinerary.totalStops, color: "text-cyan-400", icon: "📍" },
                  { label: "Duration", value: formatTime(itinerary.totalTimeMinutes), color: "text-emerald-400", icon: "⏱️" },
                  { label: "Est. Cost", value: itinerary.estimatedCost, color: "text-amber-400", icon: "💰" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10">
                    <div className="text-xl mb-1">{stat.icon}</div>
                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-slate-400 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary list */}
            <div className="space-y-3">
              {itinerary.itinerary.map((stop, idx) => (
                <div
                  key={stop.monumentId || idx}
                  onClick={() => onSelectMonument && onSelectMonument(stop.monumentId)}
                  className="group flex items-center gap-4 bg-white/[0.04] border border-white/8 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  {/* Number */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-md shadow-cyan-500/30">
                    {idx + 1}
                  </div>

                  {/* Image */}
                  {stop.imageUrl && (
                    <img src={stop.imageUrl} alt={stop.name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/10"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate group-hover:text-cyan-300 transition-colors">{stop.name}</h4>
                    <p className="text-slate-500 text-xs">{stop.category}</p>
                    <div className="flex gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-cyan-400/15 text-cyan-300 rounded-full">⏱ {stop.visitDuration || 30} min</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-400/15 text-amber-300 rounded-full">🎫 {stop.entryFee || "Free"}</span>
                      {stop.isPopular && <span className="text-xs px-2 py-0.5 bg-orange-400/15 text-orange-300 rounded-full">⭐ Popular</span>}
                    </div>
                  </div>
                  <span className="text-slate-600 group-hover:text-cyan-400 transition-colors text-xl">→</span>
                </div>
              ))}
            </div>

            {/* Smart Tip */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div>
                <p className="text-amber-200 font-bold text-sm">Pro Tip</p>
                <p className="text-amber-200/70 text-xs mt-1">Visit during early morning (before 10AM) for low crowds and best photography light.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={saveItinerary}
                  className="flex-1 py-4 bg-white/[0.06] hover:bg-white/10 border border-white/10 hover:border-lime-400/40 rounded-2xl font-bold text-slate-200 transition-all duration-200"
                >
                  💾 Save Tour
                </button>
                <button
                  onClick={startTourInMap}
                  className="flex-1 py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black rounded-2xl hover:shadow-[0_0_25px_rgba(163,230,53,0.4)] transition-all duration-300 hover:scale-[1.01]"
                >
                  🗺️ Open in Tour Planner
                </button>
              </div>
              <button
                onClick={() => { setItinerary(null); setStep(1); }}
                className="w-full py-3 text-slate-400 hover:text-white text-sm font-bold transition-colors"
              >
                ↩ Start Over
              </button>
            </div>

            {savedMsg && (
              <div className="text-center py-2 text-lime-400 font-bold text-sm animate-pulse">{savedMsg}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedTour;
