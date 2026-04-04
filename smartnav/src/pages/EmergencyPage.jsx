import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const EmergencyPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [sosConfirm, setSosConfirm] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emergencyContact, setEmergencyContact] = useState(JSON.parse(localStorage.getItem("emergencyContact") || "null"));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", relation: "" });
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) =>
      setUserLocation({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) })
    );
  }, []);

  const triggerSOS = () => {
    if (!sosConfirm) { setSosConfirm(true); return; }
    setSosConfirm(false);
    setSosActive(true);
    let c = 5;
    setCountdown(c);
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(iv);
        const msg = userLocation
          ? `🆘 SOS! I need help! My location: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`
          : "🆘 SOS! I need immediate help!";
        navigator.clipboard?.writeText(msg).catch(() => {});
        setCopyMsg("📋 Location copied! Share it with emergency contacts.");
        setSosActive(false);
        setTimeout(() => setCopyMsg(""), 5000);
      }
    }, 1000);
  };

  const saveContact = () => {
    localStorage.setItem("emergencyContact", JSON.stringify(form));
    setEmergencyContact(form);
    setEditing(false);
  };

  const numbers = [
    { name: "Police", num: "100", icon: "👮", bg: "from-blue-600 to-blue-700" },
    { name: "Ambulance", num: "102", icon: "🚑", bg: "from-red-600 to-red-700" },
    { name: "Fire", num: "101", icon: "🚒", bg: "from-orange-600 to-orange-700" },
    { name: "Tourist Help", num: "1363", icon: "📞", bg: "from-teal-600 to-teal-700" },
    { name: "Women Safety", num: "1091", icon: "🛡️", bg: "from-purple-600 to-purple-700" },
    { name: "Traffic", num: "1073", icon: "🚦", bg: "from-yellow-600 to-yellow-700" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#060b18] text-white">
      {/* Red ambient glow */}
      <div className="fixed top-0 right-0 w-80 h-80 bg-red-600/8 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="px-8 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-2xl shadow-lg shadow-red-500/30 animate-pulse">
            🆘
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Emergency Hub</h1>
            <p className="text-slate-400 text-sm">Quick access to emergency services</p>
          </div>
        </div>
        {userLocation && (
          <div className="mt-4 flex items-center gap-2 bg-white/[0.04] border border-white/8 rounded-xl px-4 py-2 w-fit">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-xs font-bold">GPS: {userLocation.lat}, {userLocation.lng}</span>
          </div>
        )}
      </div>

      <div className="px-8 space-y-6 pb-16">
        {/* SOS Button */}
        <div className="relative bg-gradient-to-br from-red-950/60 to-black border border-red-900/50 rounded-3xl p-8 overflow-hidden text-center">
          <div className="absolute inset-0 bg-red-500/3 animate-pulse" />

          {sosActive ? (
            <div className="relative">
              <div className="text-8xl font-black text-red-400 animate-bounce mb-4">{countdown}</div>
              <p className="text-red-300 font-bold animate-pulse text-lg">Preparing SOS message...</p>
            </div>
          ) : sosConfirm ? (
            <div className="relative space-y-4">
              <p className="text-red-200 text-xl font-black">⚠️ Confirm SOS?</p>
              <p className="text-slate-400 text-sm">This will copy your GPS location link to your clipboard for sharing.</p>
              <div className="flex gap-4 justify-center">
                <button onClick={triggerSOS} className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-red-600/30">
                  🆘 Yes, Send SOS
                </button>
                <button onClick={() => setSosConfirm(false)} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl text-lg transition-all">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={triggerSOS}
                className="relative w-44 h-44 mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #ef4444, #991b1b)",
                  boxShadow: "0 0 0 6px rgba(239,68,68,0.15), 0 0 60px rgba(239,68,68,0.4), 0 0 120px rgba(239,68,68,0.2)"
                }}
              >
                <span className="text-5xl">🆘</span>
                <span className="text-white font-black text-xl mt-1 tracking-widest">SOS</span>
              </button>
              <p className="text-slate-300 font-bold mt-5 text-lg">One-Tap Emergency Alert</p>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Copies your GPS coordinates for immediate sharing with emergency services</p>

              {copyMsg && (
                <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-xl p-3 text-green-300 text-sm font-bold animate-pulse">
                  {copyMsg}
                </div>
              )}

              <div className="flex justify-center gap-4 mt-5">
                <a href="tel:100" className="flex items-center gap-2 px-5 py-3 bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/40 rounded-2xl font-bold text-sm transition-all hover:scale-105">
                  👮 Call Police
                </a>
                <a href="tel:102" className="flex items-center gap-2 px-5 py-3 bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/40 rounded-2xl font-bold text-sm transition-all hover:scale-105">
                  🚑 Ambulance
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Numbers */}
        <div>
          <h2 className="text-xl font-black text-white mb-4">📞 Emergency Numbers</h2>
          <div className="grid grid-cols-3 gap-3">
            {numbers.map((em) => (
              <a
                key={em.num}
                href={`tel:${em.num}`}
                className={`group bg-gradient-to-br ${em.bg} bg-opacity-20 rounded-2xl p-4 text-center hover:scale-105 transition-all duration-200 border border-white/10 hover:border-white/20 hover:shadow-lg`}
              >
                <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">{em.icon}</div>
                <p className="text-white font-black text-xl">{em.num}</p>
                <p className="text-white/80 font-bold text-xs mt-0.5">{em.name}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6">
          <h2 className="text-xl font-black text-white mb-4">👤 My Emergency Contact</h2>

          {editing ? (
            <div className="space-y-3">
              {[
                { key: "name", placeholder: "Contact Name" },
                { key: "phone", placeholder: "Phone Number" },
                { key: "relation", placeholder: "Relation (Mom, Friend...)" },
              ].map((f) => (
                <input
                  key={f.key}
                  value={form[f.key]}
                  onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-400/60 transition"
                />
              ))}
              <div className="flex gap-3">
                <button onClick={saveContact} className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black rounded-xl transition hover:shadow-lg text-sm">
                  💾 Save Contact
                </button>
                <button onClick={() => setEditing(false)} className="px-5 py-3 bg-white/[0.06] border border-white/10 text-slate-300 font-bold rounded-xl transition text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : emergencyContact ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-black text-lg">{emergencyContact.name}</p>
                <p className="text-slate-400 text-sm">{emergencyContact.relation}</p>
                <a href={`tel:${emergencyContact.phone}`} className="text-red-400 font-black hover:text-red-300 transition text-lg mt-1 block">
                  📞 {emergencyContact.phone}
                </a>
              </div>
              <button
                onClick={() => { setForm(emergencyContact); setEditing(true); }}
                className="px-4 py-2 bg-white/[0.06] border border-white/10 text-slate-300 rounded-xl text-sm font-bold hover:bg-white/10 transition"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm mb-4">Add a contact for quick access during emergencies</p>
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black rounded-xl hover:shadow-lg shadow-red-500/20 transition text-sm"
              >
                + Add Emergency Contact
              </button>
            </div>
          )}
        </div>

        {/* Safety Tips */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <h3 className="text-amber-300 font-black text-base mb-3 flex items-center gap-2">⚠️ Safety Tips</h3>
          <ul className="space-y-2">
            {["Keep emergency numbers saved offline", "Inform someone of your daily itinerary", "Carry ID documents at all times", "Stay in well-lit public areas after dark", "Use registered taxis — avoid unknown rides"].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-lime-400 mt-0.5 flex-shrink-0">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;
