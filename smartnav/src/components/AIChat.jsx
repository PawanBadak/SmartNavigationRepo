import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const AIChat = ({ currentMonumentId, selectedPlace }) => {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Namaste! I am your Ajanta AI Guide. How can I help you explore the caves today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/ai", {
        prompt: input,
        monumentId: currentMonumentId,
        mainPlaceId: selectedPlace?.mainPlaceId,
        placeName: selectedPlace?.name,
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
      <div className="p-6 border-b border-white/5 bg-white/5">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-purple-500/20 rounded-lg">🤖</span> SmartNav Assistant
        </h3>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">AI-Powered Historical Insights</p>
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
              AI is analyzing history...
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
            placeholder="Ask about cave paintings, history, or directions..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
          />
          <button 
            onClick={handleSendMessage}
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