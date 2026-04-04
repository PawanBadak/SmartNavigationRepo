import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: localStorage.getItem("theme") || "dark",
    language: localStorage.getItem("language") || "en",
    notifications: localStorage.getItem("notifications") === "true",
    distanceUnit: localStorage.getItem("distanceUnit") || "km",
    gpsTracking: localStorage.getItem("gpsTracking") === "true",
    offlineMaps: localStorage.getItem("offlineMaps") === "true",
    soundEnabled: localStorage.getItem("soundEnabled") !== "false",
  });

  const [feedback, setFeedback] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem("adminEmail") || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || "");

  // Persist settings to localStorage
  useEffect(() => {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }, [settings]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveFeedback = () => {
    if (feedback.trim()) {
      // Store feedback locally
      const feedbackList = JSON.parse(localStorage.getItem("userFeedback") || "[]");
      feedbackList.push({
        message: feedback,
        timestamp: new Date().toLocaleString(),
      });
      localStorage.setItem("userFeedback", JSON.stringify(feedbackList));
      
      setSavedMessage("✅ Feedback saved! Thank you for your suggestion.");
      setFeedback("");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  };

  const handleClearCache = () => {
    localStorage.clear();
    setSavedMessage("✅ Cache cleared successfully!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleExportSettings = () => {
    const exportData = {
      settings,
      exportDate: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartnav-settings.json";
    link.click();
    setSavedMessage("✅ Settings exported!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/admin/login`, {
        email: adminEmail,
        password: adminPassword,
      });

      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminEmail", adminEmail);
      setAdminToken(response.data.token);
      setAdminPassword("");
      setSavedMessage("✅ Admin login successful. Admin panel is now available.");
      window.dispatchEvent(new Event("storage"));
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err) {
      setSavedMessage(err.response?.data?.error || "❌ Invalid admin login");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    setAdminToken("");
    setAdminPassword("");
    setSavedMessage("✅ Admin logged out");
    window.dispatchEvent(new Event("storage"));
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#0c1220] to-[#050810] p-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400 mb-2">
          Settings
        </h1>
        <p className="text-slate-400">Customize your SmartNav experience</p>
      </div>

      {/* Success Message */}
      {savedMessage && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-400/50 rounded-lg text-emerald-300 animate-pulse">
          {savedMessage}
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Display Settings */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-lime-400/30 transition">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎨</span> Display Settings
          </h2>
          
          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition">
              <div>
                <p className="font-semibold">Theme</p>
                <p className="text-sm text-slate-400">Dark or Light mode</p>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
                className="bg-lime-400/20 border border-lime-400/50 text-white px-3 py-1 rounded-lg focus:outline-none focus:border-lime-400"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            {/* Distance Unit */}
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition">
              <div>
                <p className="font-semibold">Distance Unit</p>
                <p className="text-sm text-slate-400">Kilometers or Miles</p>
              </div>
              <select
                value={settings.distanceUnit}
                onChange={(e) => handleChange("distanceUnit", e.target.value)}
                className="bg-lime-400/20 border border-lime-400/50 text-white px-3 py-1 rounded-lg focus:outline-none focus:border-lime-400"
              >
                <option value="km">Kilometers (km)</option>
                <option value="mi">Miles (mi)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Language & Region */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-lime-400/30 transition">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🌍</span> Language & Region
          </h2>
          
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition">
            <div>
              <p className="font-semibold">Language</p>
              <p className="text-sm text-slate-400">Choose your preferred language</p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleChange("language", e.target.value)}
              className="bg-lime-400/20 border border-lime-400/50 text-white px-3 py-1 rounded-lg focus:outline-none focus:border-lime-400"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
        </section>

        {/* Features & Notifications */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-lime-400/30 transition">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔔</span> Features & Notifications
          </h2>
          
          <div className="space-y-3">
            {/* Notifications */}
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition">
              <div>
                <p className="font-semibold">Push Notifications</p>
                <p className="text-sm text-slate-400">Get travel updates</p>
              </div>
              <button
                onClick={() => handleToggle("notifications")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  settings.notifications
                    ? "bg-lime-400/30 border border-lime-400 text-lime-300"
                    : "bg-slate-600/30 border border-slate-500 text-slate-400"
                }`}
              >
                {settings.notifications ? "ON" : "OFF"}
              </button>
            </div>

            {/* GPS Tracking */}
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition">
              <div>
                <p className="font-semibold">GPS Tracking</p>
                <p className="text-sm text-slate-400">Track real-time location</p>
              </div>
              <button
                onClick={() => handleToggle("gpsTracking")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  settings.gpsTracking
                    ? "bg-lime-400/30 border border-lime-400 text-lime-300"
                    : "bg-slate-600/30 border border-slate-500 text-slate-400"
                }`}
              >
                {settings.gpsTracking ? "ON" : "OFF"}
              </button>
            </div>

            {/* Offline Maps */}
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition">
              <div>
                <p className="font-semibold">Offline Maps</p>
                <p className="text-sm text-slate-400">Use maps without internet</p>
              </div>
              <button
                onClick={() => handleToggle("offlineMaps")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  settings.offlineMaps
                    ? "bg-lime-400/30 border border-lime-400 text-lime-300"
                    : "bg-slate-600/30 border border-slate-500 text-slate-400"
                }`}
              >
                {settings.offlineMaps ? "ON" : "OFF"}
              </button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition">
              <div>
                <p className="font-semibold">Sound Effects</p>
                <p className="text-sm text-slate-400">Navigation audio alerts</p>
              </div>
              <button
                onClick={() => handleToggle("soundEnabled")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  settings.soundEnabled
                    ? "bg-lime-400/30 border border-lime-400 text-lime-300"
                    : "bg-slate-600/30 border border-slate-500 text-slate-400"
                }`}
              >
                {settings.soundEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </section>

        {/* Admin Access */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-lime-400/30 transition">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🛠️</span> Admin Access
          </h2>

          {!adminToken ? (
            <form onSubmit={handleAdminLogin} className="space-y-3 rounded-lg bg-black/30 p-4">
              <p className="text-sm text-slate-400">Login as admin to unlock the Admin panel.</p>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Admin email"
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-slate-100 placeholder-slate-400"
                required
              />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-slate-100 placeholder-slate-400"
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-lime-400 px-4 py-2 font-bold text-black hover:bg-lime-300 transition"
              >
                Admin Login
              </button>
            </form>
          ) : (
            <div className="space-y-3 rounded-lg bg-black/30 p-4">
              <p className="text-sm text-lime-300">Admin is logged in. You can open the Admin panel now.</p>
              <button
                onClick={handleAdminLogout}
                className="rounded-xl border border-slate-500 px-4 py-2 font-semibold text-slate-200 hover:border-red-400 hover:text-red-300 transition"
              >
                Logout Admin
              </button>
            </div>
          )}
        </section>

        {/* Account & Data */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-lime-400/30 transition">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span> Account & Data
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={handleExportSettings}
              className="w-full p-3 bg-blue-500/20 border border-blue-400/50 rounded-lg hover:bg-blue-500/30 transition text-blue-300 font-semibold"
            >
              📥 Export Settings
            </button>
            <button
              onClick={handleClearCache}
              className="w-full p-3 bg-orange-500/20 border border-orange-400/50 rounded-lg hover:bg-orange-500/30 transition text-orange-300 font-semibold"
            >
              🗑️ Clear Cache & Data
            </button>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-lime-400/30 transition">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">💬</span> Feedback & Support
          </h2>
          
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts, suggestions, or report issues..."
            className="w-full p-3 bg-black/30 border border-white/10 rounded-lg focus:border-lime-400 focus:outline-none text-white placeholder-slate-500 mb-3 resize-none"
            rows="4"
          />
          <button
            onClick={handleSaveFeedback}
            disabled={!feedback.trim()}
            className="w-full p-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📨 Send Feedback
          </button>
        </section>

        {/* About Section */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">ℹ️</span> About SmartNav
          </h2>
          
          <div className="space-y-2 text-slate-300">
            <p><strong>App Version:</strong> 1.0.0</p>
            <p><strong>Build:</strong> April 2026</p>
            <p><strong>Developer:</strong> SmartNav Team</p>
            <p className="text-sm text-slate-400 mt-4">
              SmartNav is an intelligent travel assistant that helps you navigate, discover monuments, and plan your journeys efficiently.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
