import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_URL = "https://smartnavigationrepo.onrender.com/api";

const Dashboard = ({ selectedPlace, onSelectMonument, onSwitchTab, language = "en" }) => {
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainAudio, setMainAudio] = useState(null);
  const [isPlayingMain, setIsPlayingMain] = useState(false);
  const audioRef = useRef(null);

  const translations = {
    en: {
      explore: "Explore the best places around you",
      audioGuide: "Audio Guide",
      viewMap: "View Map",
      askAI: "Ask AI",
      popularPlaces: "Popular Places ⭐",
      allPlaces: "All Places",
      loading: "Loading amazing places near you...",
      noPlaces: "No places found for this location",
    },
    hi: {
      explore: "अपने आसपास के बेहतरीन स्थानों का अन्वेषण करें",
      audioGuide: "ऑडियो गाइड",
      viewMap: "मानचित्र देखें",
      askAI: "एआई से पूछें",
      popularPlaces: "लोकप्रिय स्थान ⭐",
      allPlaces: "सभी स्थान",
      loading: "आपके पास के अद्भुत स्थान लोड हो रहे हैं...",
      noPlaces: "इस स्थान के लिए कोई स्थान नहीं मिला",
    },
    mr: {
      explore: "आपल्या आजूबाजूच्या सर्वोत्तम ठिकाणांचा शोध घ्या",
      audioGuide: "ऑडिओ मार्गदर्शक",
      viewMap: "नकाशा पहा",
      askAI: "एआयला विचारा",
      popularPlaces: "लोकप्रिय ठिकाणे ⭐",
      allPlaces: "सर्व ठिकाणे",
      loading: "आपल्या जवळील अद्भुत ठिकाणे लोड होत आहेत...",
      noPlaces: "या ठिकाणासाठी कोणतीही ठिकाणे सापडली नाहीत",
    }
  };

  useEffect(() => {
    const fetchMonuments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/monuments?location=${selectedPlace.name}`);
        setMonuments(res.data);
      } catch (err) {
        console.error("Error fetching monuments:", err);
        setMonuments([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchMainAudio = async () => {
      try {
        const res = await axios.get(`${API_URL}/audio/main?location=${selectedPlace.name}`);
        setMainAudio(res.data.url);
      } catch (err) {
        console.error("Error fetching main audio:", err);
      }
    };

    if (selectedPlace) {
      fetchMonuments();
      fetchMainAudio();
    }
  }, [selectedPlace]);

  const popularPlaces = monuments.filter(m => m.isPopular).slice(0, 3);

  const handleAudioGuide = () => {
    if (!mainAudio) {
      alert("Main audio guide not available");
      return;
    }

    if (isPlayingMain) {
      audioRef.current.pause();
      setIsPlayingMain(false);
    } else {
      audioRef.current = new Audio(mainAudio);
      audioRef.current.play().then(() => setIsPlayingMain(true)).catch(err => console.error(err));
      audioRef.current.onended = () => setIsPlayingMain(false);
    }
  };

  const handleViewMap = () => {
    onSwitchTab("Live Map");
  };

  const handleAskAI = () => {
    onSwitchTab("AI Chat");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#050810] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-lg font-semibold">{translations[language].loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#050810] text-white custom-scrollbar">
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
        `}
      </style>

      {/* Header Section */}
      <div className="p-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-3xl font-black text-white">{selectedPlace.name}</h1>
              <p className="text-slate-400 text-lg">{translations[language].explore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-8 pb-8">
        <div className="flex gap-4">
          <button
            onClick={handleAudioGuide}
            className={`flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-all hover:scale-105 flex items-center justify-center gap-2 ${
              isPlayingMain ? "bg-lime-400 text-black" : ""
            }`}
          >
            <span>{isPlayingMain ? "⏸️" : "🎧"}</span>
            <span>{translations[language].audioGuide}</span>
          </button>
          <button
            onClick={handleViewMap}
            className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🗺️</span>
            <span>{translations[language].viewMap}</span>
          </button>
          <button
            onClick={handleAskAI}
            className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🤖</span>
            <span>{translations[language].askAI}</span>
          </button>
        </div>
      </div>

      {/* Popular Places Section */}
      {popularPlaces.length > 0 && (
        <div className="px-8 pb-8">
          <h2 className="text-2xl font-bold text-white mb-6">{translations[language].popularPlaces}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularPlaces.map((place) => (
              <div
                key={place.monumentId}
                onClick={() => onSelectMonument(place.monumentId)}
                className="bg-white/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all hover:scale-105 border border-transparent hover:border-lime-400/30"
              >
                <div className="h-48 overflow-hidden">
                  {place.imageUrl ? (
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-full h-full object-cover hover:scale-110 transition duration-500"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <span className="text-4xl">🏛️</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold text-lg mb-2">{place.name}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {place.shortDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Places Section */}
      <div className="px-8 pb-8">
        <h2 className="text-2xl font-bold text-white mb-6">{translations[language].allPlaces}</h2>
        {monuments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">{translations[language].noPlaces}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {monuments.map((place) => (
              <div
                key={place.monumentId}
                onClick={() => onSelectMonument(place.monumentId)}
                className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all hover:scale-102 border border-transparent hover:border-lime-400/30"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  {place.imageUrl ? (
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/80x80?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <span className="text-2xl">🏛️</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{place.name}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {place.shortDescription}
                  </p>
                </div>
                <div className="text-lime-400 text-xl">
                  →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
