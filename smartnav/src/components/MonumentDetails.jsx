import React, { useEffect, useState } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const API_URL = "http://localhost:5000/api";

const MonumentDetail = ({ id, onBack, onNavigate, onStartNavigation }) => {
  const [monument, setMonument] = useState(null);
  const [nearbyData, setNearbyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [ratings, setRatings] = useState({ ratings: [], average: 0, count: 0 });
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingMsg, setRatingMsg] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [inTour, setInTour] = useState(false);
  const [crowdLevel, setCrowdLevel] = useState("medium");

  const [userLocation] = useState({ lat: 20.5525, lng: 75.7033 });

  // Determine crowd level based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 9 || hour >= 17) setCrowdLevel("low");
    else if (hour >= 10 && hour <= 14) setCrowdLevel("high");
    else setCrowdLevel("medium");
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [monRes, nearbyRes, ratingsRes] = await Promise.allSettled([
          axios.get(`${API_URL}/monuments/${id}`),
          axios.get(`${API_URL}/monuments/nearby/${id}`),
          axios.get(`${API_URL}/ratings/${id}`),
        ]);

        if (monRes.status === "fulfilled") {
          setMonument(monRes.value.data);
          // Track visit
          axios.post(`${API_URL}/monuments/${id}/visit`).catch(() => {});
          // Track in visit history (localStorage)
          const history = JSON.parse(localStorage.getItem("visitHistory") || "[]");
          const exists = history.find((h) => h.monumentId === id);
          if (!exists) {
            history.push({ monumentId: id, name: monRes.value.data.name, visitedAt: new Date().toISOString() });
            localStorage.setItem("visitHistory", JSON.stringify(history));
          }
        }
        if (nearbyRes.status === "fulfilled") setNearbyData(nearbyRes.value.data);
        if (ratingsRes.status === "fulfilled") setRatings(ratingsRes.value.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();

    // Check saved & tour status
    const savedPlaces = JSON.parse(localStorage.getItem("savedPlaces") || "[]");
    setIsSaved(savedPlaces.some((p) => p.id === id));
    const tour = JSON.parse(localStorage.getItem("currentTour") || "[]");
    setInTour(tour.some((t) => t.monumentId === id));
  }, [id]);

  const handlePlayAudio = () => {
    if (!monument?.audioUrl) { alert("Audio guide not available"); return; }
    if (audio && isPlaying) { audio.pause(); setIsPlaying(false); return; }
    if (audio && !isPlaying) { audio.play(); setIsPlaying(true); return; }
    const newAudio = new Audio(monument.audioUrl);
    newAudio.play().then(() => { setAudio(newAudio); setIsPlaying(true); }).catch(() => alert("Audio failed to play"));
    newAudio.onended = () => setIsPlaying(false);
  };

  const handleSavePlace = () => {
    const savedPlaces = JSON.parse(localStorage.getItem("savedPlaces") || "[]");
    if (isSaved) {
      const updated = savedPlaces.filter((p) => p.id !== id);
      localStorage.setItem("savedPlaces", JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedPlaces.push({
        id,
        name: monument?.name,
        category: monument?.category,
        saved: new Date().toLocaleDateString(),
        rating: 0,
        notes: "",
        imageUrl: monument?.imageUrl,
      });
      localStorage.setItem("savedPlaces", JSON.stringify(savedPlaces));
      setIsSaved(true);
    }
  };

  const handleAddToTour = () => {
    if (!monument) return;
    const tour = JSON.parse(localStorage.getItem("currentTour") || "[]");
    if (inTour) {
      const updated = tour.filter((t) => t.monumentId !== id);
      localStorage.setItem("currentTour", JSON.stringify(updated));
      setInTour(false);
    } else {
      tour.push({ ...monument, monumentId: id });
      localStorage.setItem("currentTour", JSON.stringify(tour));
      setInTour(true);
    }
  };

  const handleSubmitRating = async () => {
    if (userRating === 0) { setRatingMsg("Please select a star rating"); return; }
    setSubmittingRating(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      await axios.post(`${API_URL}/ratings/${id}`, {
        stars: userRating,
        review: userReview,
        userId: user?.userId || "guest",
        userName: user?.name || "Anonymous",
      });
      const updated = await axios.get(`${API_URL}/ratings/${id}`);
      setRatings(updated.data);
      setRatingMsg("✅ Thank you for your rating!");
      setUserRating(0);
      setUserReview("");
    } catch {
      setRatingMsg("❌ Could not submit rating");
    } finally {
      setSubmittingRating(false);
      setTimeout(() => setRatingMsg(""), 3000);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-white"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"/><p>Loading...</p></div></div>;
  if (!monument) return null;

  const crowdConfig = {
    low: { label: "Low Crowd", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", dot: "bg-green-400" },
    medium: { label: "Moderate Crowd", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", dot: "bg-yellow-400" },
    high: { label: "High Crowd", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", dot: "bg-red-400" },
  };
  const crowd = crowdConfig[crowdLevel];

  const renderStars = (count, interactive = false, onSelect = null) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onSelect && onSelect(star)}
          className={`text-2xl transition-all ${interactive ? "hover:scale-125 cursor-pointer" : "cursor-default"} ${
            star <= count ? "text-yellow-400" : "text-slate-600"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[#050810] text-white">
      {/* Image Slider */}
      <div className="relative h-80">
        <Swiper spaceBetween={10} slidesPerView={1}>
          {(monument.images?.length > 0 ? monument.images : monument.imageUrl ? [monument.imageUrl] : ["https://placehold.co/800x400/060b18/e2e8f0?text=No+Image"])
            .map((img, i) => (
              <SwiperSlide key={i}>
                <img src={img} className="w-full h-80 object-cover" alt="" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x400/060b18/e2e8f0?text=Image+Error"; }} />
              </SwiperSlide>
            ))}
        </Swiper>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />
        <button onClick={onBack} className="absolute top-5 left-5 z-50 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-white hover:bg-black/80 transition">← Back</button>

        {/* Crowd Badge */}
        <div className={`absolute top-5 right-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${crowd.bg} ${crowd.color}`}>
          <span className={`w-2 h-2 rounded-full ${crowd.dot} animate-pulse`} />
          {crowd.label}
        </div>

        <div className="absolute bottom-5 left-5">
          <h1 className="text-3xl font-bold">{monument.name}</h1>
          <p className="text-slate-300">{monument.shortDescription}</p>
          {ratings.count > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white font-bold">{ratings.average}</span>
              <span className="text-slate-400 text-sm">({ratings.count} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-5 py-4 flex items-center justify-between bg-white/5 border-b border-white/5 flex-wrap gap-3">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handlePlayAudio}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isPlaying ? "bg-lime-400 text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            <span>{isPlaying ? "⏸️" : "🎧"}</span>
            <span className="text-xs uppercase tracking-widest">{isPlaying ? "Playing" : "Audio Guide"}</span>
          </button>

          <button
            onClick={handleSavePlace}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isSaved ? "bg-pink-500/30 text-pink-300 border border-pink-500/50" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            <span>{isSaved ? "❤️" : "🤍"}</span>
            <span className="text-xs uppercase tracking-widest">{isSaved ? "Saved" : "Save"}</span>
          </button>

          <button
            onClick={handleAddToTour}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${inTour ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            <span>{inTour ? "✔" : "+"}</span>
            <span className="text-xs uppercase tracking-widest">{inTour ? "In Tour" : "Add to Tour"}</span>
          </button>
        </div>

        <button
          onClick={() => onStartNavigation(monument)}
          className="text-lime-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition"
        >
          📍 View on Map
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-5 border-b border-white/10 overflow-x-auto">
        {["overview", "history", "visit", "reviews"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 capitalize whitespace-nowrap flex-shrink-0 ${
              activeTab === tab ? "text-lime-400 border-b-2 border-lime-400" : "text-slate-400 hover:text-white"
            } transition`}
          >
            {tab === "reviews" ? `⭐ Reviews (${ratings.count})` : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 space-y-6">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div className="bg-white/5 p-5 rounded-2xl">
              <h3 className="font-bold mb-2">📖 About</h3>
              {nearbyData && (
                <div className="bg-gradient-to-r from-lime-400/20 to-emerald-400/10 border border-lime-400/30 rounded-2xl p-5 mb-4">
                  <p className="text-lime-400 font-bold text-lg mb-3">🟢 You are at {nearbyData.current}</p>
                  {nearbyData.next && (
                    <div className="mb-4">
                      <p className="text-white font-bold mb-2">🚀 Recommended Next Stop</p>
                      <div className="bg-lime-400/10 border border-lime-400/40 p-4 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lime-400 text-lg font-bold">{nearbyData.next.name}</p>
                            <p className="text-slate-300 text-sm">{nearbyData.next.distance} meters away</p>
                          </div>
                          <button onClick={() => onStartNavigation(nearbyData.next)} className="bg-lime-400 text-black px-4 py-2 rounded-xl font-bold hover:scale-105 transition">
                            Navigate →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold mb-2">📍 Nearby Places</p>
                    {nearbyData.nearby.map((place, i) => (
                      <div key={i} onClick={() => onStartNavigation(place)}
                        className="flex justify-between items-center text-slate-300 text-sm py-2 px-2 rounded-xl hover:bg-white/10 cursor-pointer transition">
                        <span>{place.name}</span>
                        <div className="flex items-center gap-2">
                          <span>{place.distance}m</span>
                          <span className="text-lime-400">→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-slate-300">{monument.description}</p>
            </div>

            {monument.highlights?.length > 0 && (
              <div className="bg-white/5 p-5 rounded-2xl">
                <h3 className="font-bold mb-3">✨ Highlights</h3>
                {monument.highlights.map((h, i) => (
                  <p key={i} className="text-slate-300">• {h}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 p-4 rounded-xl text-center">🕐<br />{monument.timings || "9AM-5PM"}</div>
              <div className="bg-white/5 p-4 rounded-xl text-center">🎫<br />{monument.entryFee || "Free"}</div>
              <div className="bg-white/5 p-4 rounded-xl text-center">⏱️<br />{monument.visitDuration || 30} min</div>
            </div>
          </>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="bg-white/5 p-5 rounded-2xl">
            <h3 className="font-bold mb-3">📜 History</h3>
            <p className="text-slate-300">{monument.history || "No historical information available."}</p>
          </div>
        )}

        {/* VISIT */}
        {activeTab === "visit" && (
          <>
            <div className="bg-white/5 p-5 rounded-2xl">
              <h3 className="font-bold mb-2">📍 Location</h3>
              <p className="text-slate-300 mb-2">📍 Coordinates: {monument.coordinates.lat}, {monument.coordinates.lng}</p>
            </div>
            <iframe
              title={`Map: ${monument.name}`}
              width="100%" height="200" className="rounded-xl"
              src={`https://maps.google.com/maps?q=${monument.coordinates.lat},${monument.coordinates.lng}&z=15&output=embed`}
            />
          </>
        )}

        {/* REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-5">
            {/* Rating Summary */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-black text-yellow-400">{ratings.average || "–"}</p>
                  <div className="mt-1">{renderStars(Math.round(ratings.average))}</div>
                  <p className="text-slate-400 text-xs mt-1">{ratings.count} reviews</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratings.ratings.filter((r) => r.stars === star).length;
                    const pct = ratings.count > 0 ? (count / ratings.count) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="text-yellow-400 w-3">{star}</span>
                        <div className="flex-1 bg-white/10 rounded-full h-1.5">
                          <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-slate-400 w-4">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Rating */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3">✍️ Write a Review</h3>
              <div className="mb-3">
                <p className="text-sm text-slate-400 mb-2">Your Rating</p>
                {renderStars(userRating, true, setUserRating)}
              </div>
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="Share your experience (optional)..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition text-sm resize-none"
                rows={3}
              />
              {ratingMsg && <p className={`text-sm font-bold mt-2 ${ratingMsg.startsWith("✅") ? "text-lime-400" : "text-red-400"}`}>{ratingMsg}</p>}
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating || userRating === 0}
                className="w-full mt-3 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black rounded-xl hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all disabled:opacity-50"
              >
                {submittingRating ? "Submitting..." : "Submit Review"}
              </button>
            </div>

            {/* Reviews List */}
            {ratings.ratings.length > 0 && (
              <div className="space-y-3">
                {ratings.ratings.map((r, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-bold">{r.userName}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-sm ${s <= r.stars ? "text-yellow-400" : "text-slate-600"}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {r.review && <p className="text-slate-300 text-sm">{r.review}</p>}
                    <p className="text-slate-500 text-xs mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
            {ratings.ratings.length === 0 && (
              <p className="text-center text-slate-400 py-8">No reviews yet. Be the first!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonumentDetail;