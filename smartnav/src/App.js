import AIChat from './components/AIChat';
import AdminDashboard from './components/AdminDashboard';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LiveMap from './pages/LiveMap';
import Dashboard from './pages/Dashboard';
import ScannerPage from './pages/Scanner';
import MonumentDetail from './components/MonumentDetails';
import HomePage from './pages/HomePage';
import Settings from './pages/Settings';
import Saved from './pages/Saved';
import EmergencyPage from './pages/EmergencyPage';
import PersonalizedTour from './pages/PersonalizedTour';
import TourPlanner from './pages/TourPlanner';
import LoginProfile from './pages/LoginProfile';

const API_URL = 'http://localhost:5000/api';

const NAV = [
  { name: "Home", icon: "🏠", section: "main" },
  { name: "Live Map", icon: "📍", section: "main" },
  { name: "Explore", icon: "🏛️", section: "main" },
  { name: "QR Scanner", icon: "📸", section: "main" },
  { name: "My Tour", icon: "🗺️", section: "main" },
  { name: "Saved", icon: "🔖", section: "main" },
  { name: "Settings", icon: "⚙️", section: "main" },
  { name: "AI Chat", icon: "🤖", section: "smart", gradient: "from-violet-600 to-purple-500" },
  { name: "Smart Tour", icon: "🎯", section: "smart", gradient: "from-cyan-600 to-blue-500" },
  { name: "Emergency", icon: "🆘", section: "smart", gradient: "from-red-600 to-rose-600", pulse: true },
  { name: "Profile", icon: "👤", section: "smart", gradient: "from-pink-600 to-purple-500" },
];

const App = () => {
  const [language, setLanguage] = useState("en");
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem("adminToken"));
  const [navigationTarget, setNavigationTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("Home");
  const [selectedMonumentId, setSelectedMonumentId] = useState(null);
  const [lastViewedMonumentId, setLastViewedMonumentId] = useState(null);
  const [location, setLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [currentDistrict, setCurrentDistrict] = useState("");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(() => setLocation("Ajanta"), () => setLocation("Ajanta"));
  }, []);

  useEffect(() => {
    const sync = () => { setIsAdmin(!!localStorage.getItem("adminToken")); setUser(JSON.parse(localStorage.getItem("user") || "null")); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const handleSelectMonument = (id) => { setSelectedMonumentId(id); setLastViewedMonumentId(id); };

  const extractScannedId = (raw) => {
    const v = String(raw || '').trim();
    if (!v) return '';
    try {
      const url = new URL(v);
      const q = url.searchParams.get('id') || url.searchParams.get('mainPlaceId') || url.searchParams.get('monumentId');
      if (q) return q.trim();
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    } catch (_) {}
    if (v.includes(':')) return v.split(':').pop().trim();
    return v;
  };

  const handleScanMatch = async (raw) => {
    const id = extractScannedId(raw);
    if (!id) return;
    try {
      const res = await axios.get(`${API_URL}/mainplaces/${id}`);
      if (res?.data?.mainPlaceId) { setSelectedPlace(res.data); setSelectedMonumentId(null); setActiveTab('Explore'); return; }
    } catch (_) {}
    handleSelectMonument(id);
  };

  const switchTab = (tab) => { setActiveTab(tab); setSelectedMonumentId(null); if (tab === "Live Map") setNavigationTarget(null); };

  const renderContent = () => {
    if (selectedMonumentId) return (
      <MonumentDetail
        id={selectedMonumentId}
        onBack={() => setSelectedMonumentId(null)}
        onNavigate={handleSelectMonument}
        onStartNavigation={(monument) => { setNavigationTarget(monument); setActiveTab("Live Map"); setSelectedMonumentId(null); }}
      />
    );

    if (!location && activeTab === "Live Map") return (
      <div className="h-full flex items-center justify-center bg-[#060b18] text-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-lime-400 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold">Requesting location...</p>
        </div>
      </div>
    );

    switch (activeTab) {
      case "Home": return <HomePage onSelectPlace={(p) => { setSelectedPlace(p); setActiveTab("Explore"); }} onNavigateToLiveMap={(p) => { setSelectedPlace(p); setNavigationTarget(null); setActiveTab("Live Map"); }} currentDistrict={currentDistrict} setCurrentDistrict={setCurrentDistrict} />;
      case "Explore": return <Dashboard selectedMainPlace={selectedPlace} onSelectMonument={handleSelectMonument} onSwitchTab={setActiveTab} language={language} />;
      case "Live Map": return <LiveMap onSelectMonument={handleSelectMonument} selectedMonumentId={selectedMonumentId} navigationTarget={navigationTarget} language={language} selectedMainPlace={selectedPlace} currentCity={currentDistrict} onSelectMainPlace={(p) => { setSelectedPlace(p); setActiveTab("Explore"); }} />;
      case "QR Scanner": return <ScannerPage onScanMatch={handleScanMatch} />;
      case "My Tour": return <TourPlanner onSelectMonument={handleSelectMonument} onSwitchTab={switchTab} selectedPlace={selectedPlace} />;
      case "Smart Tour": return <PersonalizedTour onSelectMonument={handleSelectMonument} onSwitchTab={switchTab} selectedPlace={selectedPlace} />;
      case "Emergency": return <EmergencyPage />;
      case "Profile": return <LoginProfile onSwitchTab={switchTab} />;
      case "AI Chat": return <AIChat currentMonumentId={selectedMonumentId || lastViewedMonumentId} selectedPlace={selectedPlace} />;
      case "Admin": return isAdmin ? <AdminDashboard /> : (
        <div className="flex items-center justify-center h-full text-center p-10">
          <div><h2 className="text-3xl font-black text-white mb-2">Admin Login Required</h2><p className="text-slate-400 text-sm">Login from Settings to access the admin panel.</p></div>
        </div>
      );
      case "Settings": return <Settings />;
      case "Saved": return <Saved />;
      default: return (
        <div className="flex items-center justify-center h-full text-center p-10">
          <div><h2 className="text-3xl font-black text-white mb-2">Coming Soon</h2><p className="text-slate-400">{activeTab} is under development</p></div>
        </div>
      );
    }
  };

  const isActive = (name) => activeTab === name && !selectedMonumentId;
  const mainNav = NAV.filter(n => n.section === "main");
  const smartNav = NAV.filter(n => n.section === "smart");
  const adminNav = isAdmin ? [{ name: "Admin", icon: "🛠️", gradient: "from-amber-600 to-yellow-500" }] : [];

  return (
    <div className="bg-[#030811] min-h-screen flex justify-center items-center p-3 font-sans antialiased">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-lime-500/4 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-3/4 left-1/2 w-[300px] h-[300px] bg-purple-600/4 rounded-full blur-[80px]" />
      </div>

      <div className="relative w-full max-w-[1440px] h-[920px] bg-[#0a0f1e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-[40px] flex overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] z-10">

        {/* SIDEBAR */}
        <aside className="w-60 flex flex-col border-r border-white/[0.06] bg-black/50 overflow-y-auto flex-shrink-0">
          {/* Logo */}
          <div className="px-5 pt-7 pb-5 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-emerald-600 rounded-2xl flex items-center justify-center text-black font-black text-lg shadow-lg shadow-lime-500/30">S</div>
              <div>
                <h1 className="text-white font-black text-base tracking-tight">SmartNav</h1>
                <p className="text-slate-600 text-[10px] uppercase tracking-widest">Navigation System</p>
              </div>
            </div>
          </div>

          {/* Main nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {mainNav.map((item) => (
              <button key={item.name} onClick={() => switchTab(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group ${
                  isActive(item.name)
                    ? "bg-gradient-to-r from-lime-400/20 to-transparent border-l-2 border-lime-400 text-lime-300 font-bold"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]"
                }`}
              >
                <span className={`text-base transition-transform ${isActive(item.name) ? "scale-110" : "group-hover:scale-105"}`}>{item.icon}</span>
                <span className="tracking-wide">{item.name}</span>
                {isActive(item.name) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-lime-400" />}
              </button>
            ))}
          </nav>

          {/* Smart Features */}
          <div className="px-3 pb-3 space-y-0.5">
            <p className="text-[9px] text-slate-700 uppercase tracking-[0.2em] px-3 py-2 font-black">Smart Features</p>
            {[...smartNav, ...adminNav].map((item) => (
              <button key={item.name} onClick={() => switchTab(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group relative ${
                  isActive(item.name)
                    ? `bg-gradient-to-r ${item.gradient || "from-violet-500/20 to-transparent"} border border-white/10 text-white font-bold shadow-sm`
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]"
                }`}
              >
                <span className={`text-base ${item.pulse ? "animate-pulse" : ""} transition-transform ${isActive(item.name) ? "scale-110" : "group-hover:scale-105"}`}>{item.icon}</span>
                <span className="tracking-wide">{item.name}</span>
                {item.pulse && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 animate-ping absolute right-3" />}
              </button>
            ))}
          </div>

          {/* User card */}
          <div className="p-3 border-t border-white/[0.05]">
            <button
              onClick={() => switchTab("Profile")}
              className="w-full flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-white/10 hover:bg-white/[0.06] transition group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "G"}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white text-xs font-bold truncate">{user?.name || "Guest Explorer"}</p>
                <p className="text-slate-600 text-[10px]">{user?.isGuest ? "Guest" : user ? "Member" : "Not signed in"}</p>
              </div>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="px-8 py-4 flex items-center justify-between border-b border-white/[0.05] bg-black/20 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-4">
              {selectedMonumentId && (
                <button onClick={() => setSelectedMonumentId(null)} className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-400 hover:text-white transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <div>
                <h2 className="text-white font-black text-lg tracking-tight">
                  {selectedMonumentId ? "Heritage Detail" : activeTab}
                </h2>
                <p className="text-slate-600 text-[10px] uppercase tracking-[0.15em] font-bold">Smart Navigation System</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/[0.04] text-slate-300 px-3 py-2 rounded-xl border border-white/8 focus:outline-none focus:border-lime-400/40 font-bold text-sm transition"
              >
                <option value="en">🌐 EN</option>
                <option value="hi">🇮🇳 HI</option>
                <option value="mr">🏳️ MR</option>
              </select>

              <button onClick={() => switchTab("Emergency")}
                className={`px-3 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === "Emergency" ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20"}`}
              >
                🆘 SOS
              </button>
            </div>
          </header>

          {/* Page Content */}
          <section className="flex-1 overflow-hidden">
            {renderContent()}
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;