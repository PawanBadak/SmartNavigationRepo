import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const TourPlanner = ({ onSelectMonument, onSwitchTab, selectedPlace }) => {
  const [allMonuments, setAllMonuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tourStops, setTourStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");
  const [savedMsg, setSavedMsg] = useState("");
  const [addedEffect, setAddedEffect] = useState(null);

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const parseFee = (fee) => { if (!fee) return 0; const m = fee.toString().match(/\d+/); return m ? parseInt(m[0]) : 0; };
  const formatTime = (mins) => (!mins ? "–" : mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("currentTour") || "[]");
    if (saved.length > 0) setTourStops(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("currentTour", JSON.stringify(tourStops));
  }, [tourStops]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const url = selectedPlace?.mainPlaceId
          ? `${API_URL}/mainplaces/${selectedPlace.mainPlaceId}/monuments`
          : `${API_URL}/monuments`;
        const res = await axios.get(url);
        setAllMonuments(res.data || []);
      } catch { setAllMonuments([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [selectedPlace]);

  const addStop = (m) => {
    if (tourStops.find(s => s.monumentId === m.monumentId)) return;
    setTourStops(prev => [...prev, m]);
    setAddedEffect(m.monumentId);
    setTimeout(() => setAddedEffect(null), 800);
  };

  const removeStop = (id) => setTourStops(prev => prev.filter(s => s.monumentId !== id));
  const moveStop = (idx, dir) => {
    const arr = [...tourStops];
    const t = idx + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[idx], arr[t]] = [arr[t], arr[idx]];
    setTourStops(arr);
  };

  const saveTour = () => {
    if (!tourStops.length) return;
    const itin = { id: Date.now(), name: `Tour – ${new Date().toLocaleDateString()}`, places: tourStops.map((s, i) => ({ monumentId: s.monumentId, name: s.name, order: i + 1 })), totalTime, totalCost: `₹${totalCost}`, createdAt: new Date().toISOString() };
    const ex = JSON.parse(localStorage.getItem("savedItineraries") || "[]");
    ex.push(itin);
    localStorage.setItem("savedItineraries", JSON.stringify(ex));
    setSavedMsg("✅ Saved to My Tours!");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const filtered = allMonuments.filter(m =>
    !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addedIds = new Set(tourStops.map(s => s.monumentId));

  const totalTime = tourStops.reduce((sum, s, idx) => {
    const visit = s.visitDuration || 30;
    const travel = idx > 0 ? (() => {
      const prev = tourStops[idx - 1];
      if (prev.coordinates && s.coordinates) {
        const d = haversine(prev.coordinates.lat, prev.coordinates.lng, s.coordinates.lat, s.coordinates.lng);
        return Math.max(5, Math.round(d / 1000 / 40 * 60));
      }
      return 10;
    })() : 0;
    return sum + visit + travel;
  }, 0);
  const totalCost = tourStops.reduce((sum, s) => sum + parseFee(s.entryFee), 0);

  const getCrowd = () => { const h = new Date().getHours(); return h < 9 || h >= 17 ? "low" : h >= 10 && h <= 14 ? "high" : "medium"; };
  const crowdData = { low: { label: "Low Crowd", dot: "bg-green-400", text: "text-green-400" }, medium: { label: "Moderate", dot: "bg-yellow-400", text: "text-yellow-400" }, high: { label: "High Crowd", dot: "bg-red-400", text: "text-red-400" } };
  const crowd = getCrowd();

  return (
    <div className="h-full overflow-y-auto bg-[#060b18] text-white">
      {/* Ambient */}
      <div className="fixed top-0 left-0 w-80 h-80 bg-lime-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="px-8 pt-10 pb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-lime-500/30">🗺️</div>
          <div>
            <h1 className="text-3xl font-black text-white">Tour Planner</h1>
            <p className="text-slate-400 text-sm">Build your perfect multi-stop itinerary</p>
          </div>
        </div>

        {/* Summary bar */}
        {tourStops.length > 0 && (
          <div className="bg-gradient-to-r from-lime-900/30 to-emerald-900/20 border border-lime-500/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-5">
                {[
                  { val: tourStops.length, label: "Stops", color: "text-lime-400" },
                  { val: formatTime(totalTime), label: "Time", color: "text-cyan-400" },
                  { val: totalCost > 0 ? `₹${totalCost}` : "Free", label: "Cost", color: "text-amber-400" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveTour} className="px-4 py-2 bg-white/[0.06] border border-white/10 text-slate-200 font-bold rounded-xl text-sm hover:bg-white/10 transition">💾 Save</button>
                <button onClick={() => onSwitchTab("Live Map")} className="px-4 py-2 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black rounded-xl text-sm hover:shadow-lg shadow-lime-500/20 transition">🚀 Go</button>
              </div>
            </div>
            {savedMsg && <p className="text-lime-400 text-xs font-bold mt-2 animate-pulse">{savedMsg}</p>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {["builder", "my-stops"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab ? "bg-lime-400 text-black shadow-md shadow-lime-500/20" : "bg-white/[0.05] text-slate-400 border border-white/8 hover:text-white"}`}
            >
              {tab === "builder" ? "📍 Add Stops" : `🗺️ My Route (${tourStops.length})`}
            </button>
          ))}
          {tourStops.length > 0 && (
            <button onClick={() => setTourStops([])} className="ml-auto px-4 py-2.5 text-sm font-bold text-red-400 border border-red-500/30 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition">
              🗑️ Clear
            </button>
          )}
        </div>
      </div>

      <div className="px-8 pb-10">
        {/* ADD STOPS tab */}
        {activeTab === "builder" && (
          <>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search monuments to add..."
                className="w-full bg-white/[0.04] border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-lime-400/50 transition" />
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/[0.04] border border-white/8 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((m) => {
                  const inTour = addedIds.has(m.monumentId);
                  const justAdded = addedEffect === m.monumentId;
                  return (
                    <div key={m.monumentId} className={`flex items-center gap-4 rounded-2xl p-4 border transition-all duration-300 ${inTour ? "bg-lime-400/8 border-lime-400/30" : "bg-white/[0.04] border-white/8 hover:border-white/20 hover:bg-white/[0.07]"}`}>
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt={m.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/10"
                          onError={(e) => { e.target.style.display = "none"; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate">{m.name}</h4>
                        <p className="text-slate-500 text-xs mt-0.5">{m.category}</p>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-cyan-400/15 text-cyan-300 rounded-full">⏱ {m.visitDuration || 30}min</span>
                          <span className="text-xs px-2 py-0.5 bg-amber-400/15 text-amber-300 rounded-full">🎫 {m.entryFee || "Free"}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${crowd === "low" ? "bg-green-400/15 text-green-300" : crowd === "high" ? "bg-red-400/15 text-red-300" : "bg-yellow-400/15 text-yellow-300"}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${crowdData[crowd].dot}`} />
                            {crowdData[crowd].label}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => inTour ? removeStop(m.monumentId) : addStop(m)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0 transition-all ${justAdded ? "bg-lime-400 text-black scale-110" : inTour ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30" : "bg-lime-400 text-black hover:bg-lime-300 hover:scale-105"}`}
                      >
                        {inTour ? "Remove" : justAdded ? "✓ Added!" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
                {filtered.length === 0 && <p className="text-center text-slate-400 py-12">No places found.</p>}
              </div>
            )}
          </>
        )}

        {/* MY ROUTE tab */}
        {activeTab === "my-stops" && (
          <>
            {tourStops.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-xl font-bold text-white mb-2">No stops added yet</p>
                <p className="text-slate-400 text-sm mb-6">Switch to "Add Stops" to build your route</p>
                <button onClick={() => setActiveTab("builder")} className="px-6 py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black rounded-xl">
                  + Add Stops
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tourStops.map((stop, idx) => {
                  let travel = 0;
                  if (idx > 0) {
                    const prev = tourStops[idx-1];
                    if (prev.coordinates && stop.coordinates) {
                      const d = haversine(prev.coordinates.lat, prev.coordinates.lng, stop.coordinates.lat, stop.coordinates.lng);
                      travel = Math.max(5, Math.round(d / 1000 / 40 * 60));
                    } else travel = 10;
                  }
                  return (
                    <div key={stop.monumentId}>
                      {idx > 0 && (
                        <div className="flex items-center gap-2 py-2 px-4 text-slate-500 text-xs">
                          <div className="flex-1 border-t border-dashed border-white/10" />
                          <span>🚗 ~{formatTime(travel)} travel</span>
                          <div className="flex-1 border-t border-dashed border-white/10" />
                        </div>
                      )}
                      <div className="flex items-center gap-3 bg-white/[0.04] border border-white/8 rounded-2xl p-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-black font-black text-sm flex-shrink-0 shadow-md">
                          {idx + 1}
                        </div>
                        {stop.imageUrl && (
                          <img src={stop.imageUrl} alt={stop.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                            onError={(e) => { e.target.style.display = "none"; }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 onClick={() => onSelectMonument(stop.monumentId)} className="text-white font-bold cursor-pointer hover:text-lime-400 transition truncate">{stop.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-cyan-400">⏱ {stop.visitDuration || 30}min</span>
                            <span className="text-xs text-amber-400">🎫 {stop.entryFee || "Free"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveStop(idx, -1)} disabled={idx === 0} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 disabled:opacity-20 text-xs flex items-center justify-center transition">▲</button>
                          <button onClick={() => moveStop(idx, 1)} disabled={idx === tourStops.length - 1} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 disabled:opacity-20 text-xs flex items-center justify-center transition">▼</button>
                        </div>
                        <button onClick={() => removeStop(stop.monumentId)} className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 flex items-center justify-center text-lg transition">×</button>
                      </div>
                    </div>
                  );
                })}

                {/* Summary card */}
                <div className="mt-5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-base font-black text-white mb-4">📊 Tour Summary</h3>
                  <div className="space-y-2">
                    {tourStops.map((s, i) => (
                      <div key={s.monumentId} className="flex justify-between text-sm">
                        <span className="text-slate-300 truncate flex-1">{i+1}. {s.name}</span>
                        <div className="flex gap-4 text-right ml-2">
                          <span className="text-cyan-400">{s.visitDuration || 30}min</span>
                          <span className="text-amber-400 w-16 text-right">{s.entryFee || "Free"}</span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-3 flex justify-between font-black">
                      <span className="text-white">Total</span>
                      <div className="flex gap-4">
                        <span className="text-cyan-400">{formatTime(totalTime)}</span>
                        <span className="text-amber-400 w-16 text-right">{totalCost > 0 ? `₹${totalCost}` : "Free"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={saveTour} className="flex-1 py-4 bg-white/[0.05] border border-white/10 hover:border-lime-400/40 text-white font-bold rounded-2xl transition">💾 Save Tour</button>
                  <button onClick={() => onSwitchTab("Live Map")} className="flex-1 py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black rounded-2xl hover:shadow-[0_0_25px_rgba(163,230,53,0.3)] transition">🚀 Start Tour</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TourPlanner;
