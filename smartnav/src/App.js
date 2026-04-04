import AIChat from './components/AIChat';
import AdminDashboard from './components/AdminDashboard';
import React, { useState, useEffect } from 'react';
import LiveMap from './pages/LiveMap';
import Dashboard from './pages/Dashboard';
import ScannerPage from './pages/Scanner';
import MonumentDetail from './components/MonumentDetails';
import HomePage from './pages/HomePage';

const App = () => {
    const [language, setLanguage] = useState("en"); // en, hi, mr
  const [navigationTarget, setNavigationTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("Home");
  const [selectedMonumentId, setSelectedMonumentId] = useState(null);
  const [lastViewedMonumentId, setLastViewedMonumentId] = useState(null);
  const [location, setLocation] = useState(null); // Start with null, will be set after location permission
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [currentDistrict, setCurrentDistrict] = useState("");

  // Request location permission and set to Ajanta
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // User allowed location access, set to Ajanta
          setLocation("Ajanta");
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Even if denied, still set to Ajanta for the demo
          setLocation("Ajanta");
        }
      );
    } else {
      // Geolocation not supported, set to Ajanta
      setLocation("Ajanta");
    }
  }, []);

  const menuItems = [
    { name: "Home", icon: "🏠" },
    { name: "Live Map", icon: "📍" },
    { name: "Explore", icon: "🏛️" },
    { name: "QR Scanner", icon: "📸" },
    { name: "Saved", icon: "🔖" },
    { name: "Settings", icon: "⚙️" },
    { name: "Admin", icon: "🛠️" }
  ];

  const handleSelectMonument = (id) => {
    setSelectedMonumentId(id);
    setLastViewedMonumentId(id);
  };

  const handleBack = () => {
    setSelectedMonumentId(null);
  };

  const renderContent = () => {
    if (selectedMonumentId) {
      return (
<MonumentDetail
  id={selectedMonumentId}
  onBack={handleBack}
  onNavigate={handleSelectMonument}
onStartNavigation={(monument) => {
  setNavigationTarget(monument);   // 🔥 FULL OBJECT
  setActiveTab("Live Map");        // 🔥 switch to map
  setSelectedMonumentId(null);     // 🔥 clear details view
}}
/> 
      );
    }

    // Show loading while requesting location permission
    if (!location) {
      return (
        <div className="h-full flex items-center justify-center bg-[#050810] text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Requesting location access...</p>
            <p className="text-sm text-slate-400 mt-2">Please allow location access to continue</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "Home":
        return <HomePage onSelectPlace={(place) => {
          setSelectedPlace(place);
          setActiveTab("Explore");
        }} onNavigateToLiveMap={(place) => {
          setSelectedPlace(place);
          setNavigationTarget(null);
          setActiveTab("Live Map");
        }} currentDistrict={currentDistrict} setCurrentDistrict={setCurrentDistrict} />;
      case "Explore":
        return <Dashboard selectedMainPlace={selectedPlace} onSelectMonument={handleSelectMonument} onSwitchTab={setActiveTab} language={language} />;
      case "Live Map":
        return (
          <LiveMap
            onSelectMonument={handleSelectMonument}
            selectedMonumentId={selectedMonumentId}
            navigationTarget={navigationTarget}
            language={language}
            selectedMainPlace={selectedPlace}
            currentCity={currentDistrict}
            onSelectMainPlace={(place) => {
              setSelectedPlace(place);
              setActiveTab("Explore");
            }}
          />
        );
      case "QR Scanner":
        return <ScannerPage onScanMatch={handleSelectMonument} />;
      case "Admin":
        return <AdminDashboard />;
      case "AI Chat":
        return (
          <AIChat
            currentMonumentId={selectedMonumentId || lastViewedMonumentId}
            selectedPlace={selectedPlace}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-center p-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Coming Soon</h2>
              <p className="text-slate-400 text-sm">The {activeTab} module is under construction</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-[#050810] min-h-screen flex justify-center items-center p-6 font-sans antialiased text-slate-200">
      {/* Background effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-lime-400/10 blur-[120px] animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px]" />

      <div className="relative w-full max-w-[1440px] h-[850px] bg-[#0c1220]/60 backdrop-blur-2xl border border-white/10 rounded-[48px] flex overflow-hidden shadow-2xl z-10">
        
        {/* Sidebar */}
        <aside className="w-72 p-10 flex flex-col border-r border-white/5 bg-black/40">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-2xl shadow-[0_0_20px_rgba(163,230,53,0.4)] flex items-center justify-center text-black font-black text-xl">S</div>
            <h1 className="text-white text-2xl font-bold tracking-tight">SmartNav</h1>
          </div>

          <nav className="flex-1 space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  setSelectedMonumentId(null);
                  if (item.name === "Live Map") {
                    setNavigationTarget(null);
                  }
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                  activeTab === item.name && !selectedMonumentId
                    ? 'bg-lime-400 text-black font-bold shadow-lg scale-105'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="tracking-wide">{item.name}</span>
              </button>
            ))}
          </nav>
{/* --- ADD THIS START --- */}
<div className="mt-4 mb-2 pt-4 border-t border-white/5">
  <button 
    onClick={() => setActiveTab("AI Chat")}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
      activeTab === "AI Chat" 
      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105" 
      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
    }`}
  >
    <span className="text-xl">🤖</span>
    <span className="font-bold tracking-wide">Ask AI Guide</span>
  </button>
</div>
{/* --- ADD THIS END --- */}

          {/* User Progress */}
          <div className="mt-10 p-6 bg-white/5 border border-white/5 rounded-3xl">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Explorer Level</p>
            <p className="text-white font-bold">Pro Traveler</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-3">
              <div className="w-3/4 h-full bg-lime-400 rounded-full shadow-[0_0_10px_#a3e635]" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="p-8 flex justify-between items-center border-b border-white/5 bg-black/10 backdrop-blur-md">
            <div>
              <h2 className="text-white font-bold text-xl">
                {selectedMonumentId ? "Heritage Guide" : activeTab}
              </h2>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Smart Navigation System</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-lime-400 font-bold"
                style={{ minWidth: 110 }}
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>
          </header>

          <section className="flex-1 overflow-y-auto custom-scrollbar bg-black/5">
            {renderContent()}
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
  