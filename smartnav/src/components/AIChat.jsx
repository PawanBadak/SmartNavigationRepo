import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const AIChat = ({ currentMonumentId, selectedPlace }) => {
  const [messages, setMessages] = useState([
    { role: "ai", text: "🌍 Namaste! I'm your SmartNav Travel Assistant. I can help you with directions, nearby attractions, emergency services, cultural activities, transportation options, and booking recommendations. What would you like to explore?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const scrollRef = useRef(null);

  const quickActions = [
    { id: 'transport', label: '🚗 Transport', icon: '🚗', color: 'cyan' },
    { id: 'attractions', label: '🏛️ Attractions', icon: '🏛️', color: 'amber' },
    { id: 'emergency', label: '🚨 Emergency', icon: '🚨', color: 'red' },
    { id: 'cultural', label: '🎭 Cultural', icon: '🎭', color: 'purple' },
    { id: 'bookings', label: '🏨 Bookings', icon: '🏨', color: 'green' }
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickAction = async (category) => {
    setActiveCategory(category);
    let actionPrompt = '';

    switch(category) {
      case 'transport':
        actionPrompt = 'What are my transportation options? Tell me about different travel modes (walk, bike, car, taxi, public transit).';
        break;
      case 'attractions':
        actionPrompt = 'What are the nearby attractions I can visit? Recommend some popular places.';
        break;
      case 'emergency':
        actionPrompt = 'What emergency services are available? Give me emergency contact numbers.';
        break;
      case 'cultural':
        actionPrompt = 'What cultural activities and experiences are available in this area?';
        break;
      case 'bookings':
        actionPrompt = 'Where can I book accommodations, transportation, and tours? What are the best platforms?';
        break;
      default:
        return;
    }

    setInput(actionPrompt);
    await handleSendMessage(actionPrompt);
  };

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    const userMessage = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/ai", {
        prompt: textToSend,
        monumentId: currentMonumentId,
        mainPlaceId: selectedPlace?.mainPlaceId,
        placeName: selectedPlace?.name,
        category: activeCategory
      });

      setMessages((prev) => [...prev, { role: "ai", text: response.data.reply }]);
    } catch (error) {
      const fallbackText = error?.response?.data?.reply || "I'm having trouble processing your request. Please try again.";
      setMessages((prev) => [...prev, { role: "ai", text: fallbackText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050810] animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg text-lg">🌍</span>
          SmartNav Travel Assistant
        </h3>
        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Directions • Attractions • Transport • Culture • Bookings</p>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4 border-b border-white/5 bg-black/30">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-3 font-bold">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeCategory === action.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              } disabled:opacity-50`}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" 
              ? "bg-white/10 text-white rounded-tr-none" 
              : "bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-slate-200 rounded-tl-none"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-2xl text-lime-400 text-xs animate-pulse">
              🤖 Analyzing your request...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about directions, attractions, services, bookings..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
          />
          <button 
            onClick={() => handleSendMessage()}
            disabled={isLoading}
            className="absolute right-3 top-2 w-10 h-10 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;