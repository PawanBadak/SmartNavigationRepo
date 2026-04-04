import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const LoginProfile = ({ onSwitchTab }) => {
  const [mode, setMode] = useState("profile"); // profile | login | register
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [visitHistory, setVisitHistory] = useState(
    JSON.parse(localStorage.getItem("visitHistory") || "[]")
  );
  const [savedItineraries, setSavedItineraries] = useState(
    JSON.parse(localStorage.getItem("savedItineraries") || "[]")
  );

  const interestIcons = {
    history: "🏛️", religious: "🙏", photography: "📸",
    food: "🍔", nature: "🌿", adventure: "🧗", culture: "🎭"
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/register`, {
        name: form.name,
        email: form.email || undefined,
        password: form.password || undefined,
        language: localStorage.getItem("language") || "en",
        interests: JSON.parse(localStorage.getItem("userInterests") || "[]"),
      });
      const { user: u, token } = res.data;
      localStorage.setItem("user", JSON.stringify(u));
      localStorage.setItem("userId", token);
      setUser(u);
      setMode("profile");
      setSavedMsg("✅ Account created!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/login`, {
        email: form.email,
        password: form.password,
      });
      const { user: u, token } = res.data;
      localStorage.setItem("user", JSON.stringify(u));
      localStorage.setItem("userId", token);
      setUser(u);
      setMode("profile");
      setSavedMsg("✅ Welcome back!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    const guestName = form.name.trim() || "Guest Explorer";
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/register`, {
        name: guestName,
        isGuest: true,
        language: localStorage.getItem("language") || "en",
        interests: JSON.parse(localStorage.getItem("userInterests") || "[]"),
      });
      const { user: u, token } = res.data;
      localStorage.setItem("user", JSON.stringify(u));
      localStorage.setItem("userId", token);
      setUser(u);
      setMode("profile");
    } catch {
      // Fallback: create local guest
      const guest = { name: guestName, isGuest: true, userId: `guest_${Date.now()}`, interests: [], favoritePlaces: [], visitHistory: [] };
      localStorage.setItem("user", JSON.stringify(guest));
      localStorage.setItem("userId", guest.userId);
      setUser(guest);
      setMode("profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setUser(null);
    setMode("login");
  };

  const clearHistory = () => {
    localStorage.removeItem("visitHistory");
    setVisitHistory([]);
  };

  const deleteItinerary = (id) => {
    const updated = savedItineraries.filter((it) => it.id !== id);
    setSavedItineraries(updated);
    localStorage.setItem("savedItineraries", JSON.stringify(updated));
  };

  const formatTime = (mins) => {
    if (!mins) return "–";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const AuthForm = ({ type }) => (
    <div className="max-w-md mx-auto">
      <form onSubmit={type === "login" ? handleLogin : handleRegister} className="space-y-4">
        {type === "register" && (
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your Name"
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition"
          />
        )}
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="Email Address"
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition"
          required
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder="Password"
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition"
          required
        />
        {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black rounded-2xl hover:shadow-[0_0_25px_rgba(163,230,53,0.4)] transition-all disabled:opacity-50"
        >
          {loading ? "Please wait..." : type === "login" ? "Login" : "Create Account"}
        </button>
      </form>

      {type === "register" && (
        <div className="mt-4">
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-slate-400 text-sm">or</span>
            <div className="flex-1 border-t border-white/10" />
          </div>
          <div className="flex gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name (optional)"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 text-sm transition"
            />
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-slate-300 font-bold text-sm transition"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => { setMode(type === "login" ? "register" : "login"); setError(""); }}
          className="text-slate-400 hover:text-white text-sm transition"
        >
          {type === "login" ? "No account? Register here" : "Have an account? Login"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#0c1220] to-[#050810] text-white">
      {/* Header */}
      <div className="p-8 pb-4">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1">
          {user ? "👤 My Profile" : "🔐 Login / Register"}
        </h1>
        <p className="text-slate-400 text-sm">
          {user ? `Welcome, ${user.name}!` : "Sign in to save your tours and travel history"}
        </p>
      </div>

      <div className="px-8 pb-10">
        {savedMsg && (
          <div className="mb-4 p-4 bg-emerald-500/20 border border-emerald-400/50 rounded-xl text-emerald-300 text-center font-bold animate-pulse">
            {savedMsg}
          </div>
        )}

        {!user ? (
          <div className="space-y-6">
            {/* Mode Tabs */}
            <div className="flex gap-2">
              {["login", "register"].map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(""); }}
                  className={`px-6 py-3 rounded-xl font-bold capitalize transition-all ${
                    mode === m ? "bg-purple-500/30 border border-purple-400 text-purple-300" : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
                  }`}
                >
                  {m === "login" ? "🔑 Login" : "📝 Register"}
                </button>
              ))}
            </div>
            <AuthForm type={mode === "login" ? "login" : "register"} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-black text-white">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-white text-xl font-black">{user.name}</p>
                    {user.email && <p className="text-slate-400 text-sm">{user.email}</p>}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.isGuest ? "bg-slate-600 text-slate-300" : "bg-purple-500/30 text-purple-300"}`}>
                      {user.isGuest ? "Guest" : "Member"}
                    </span>
                  </div>
                </div>
                <button onClick={handleLogout} className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-sm font-bold hover:bg-red-500/30 transition">
                  Logout
                </button>
              </div>

              {user.interests?.length > 0 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  <p className="text-slate-400 text-xs w-full mb-1">Interests:</p>
                  {user.interests.map((i) => (
                    <span key={i} className="px-2 py-1 bg-white/10 rounded-full text-xs text-slate-300">
                      {interestIcons[i] || "🎯"} {i}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-lime-400">{visitHistory.length}</p>
                <p className="text-slate-400 text-xs mt-1">Places Visited</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-cyan-400">{savedItineraries.length}</p>
                <p className="text-slate-400 text-xs mt-1">Saved Tours</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-purple-400">
                  {JSON.parse(localStorage.getItem("savedPlaces") || "[]").length}
                </p>
                <p className="text-slate-400 text-xs mt-1">Saved Places</p>
              </div>
            </div>

            {/* Saved Itineraries */}
            {savedItineraries.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <span>🗺️</span> My Saved Tours
                </h2>
                <div className="space-y-3">
                  {savedItineraries.map((itin) => (
                    <div key={itin.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-purple-400/50 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-bold">{itin.name}</h4>
                          <p className="text-slate-400 text-xs mt-1">
                            {itin.places?.length || 0} stops · {formatTime(itin.totalTime)} · {itin.totalCost || "Free"}
                          </p>
                        </div>
                        <button onClick={() => deleteItinerary(itin.id)} className="p-2 text-red-400 hover:text-red-300 transition">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visit History */}
            {visitHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>📍</span> Visit History
                  </h2>
                  <button onClick={clearHistory} className="text-red-400 text-sm font-bold hover:text-red-300 transition">Clear</button>
                </div>
                <div className="space-y-2">
                  {visitHistory.slice(-10).reverse().map((visit, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-lime-400">📍</span>
                      <div>
                        <p className="text-white text-sm font-bold">{visit.name}</p>
                        <p className="text-slate-500 text-xs">{new Date(visit.visitedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onSwitchTab("My Tour")}
                className="py-4 bg-lime-400/10 border border-lime-400/30 rounded-2xl font-bold text-lime-300 hover:bg-lime-400/20 transition">
                🗺️ Plan New Tour
              </button>
              <button onClick={() => onSwitchTab("Saved")}
                className="py-4 bg-purple-500/10 border border-purple-400/30 rounded-2xl font-bold text-purple-300 hover:bg-purple-500/20 transition">
                🔖 Saved Places
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginProfile;
