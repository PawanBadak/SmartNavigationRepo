import React, { useState, useEffect } from "react";

const Saved = () => {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [filter, setFilter] = useState("all");

  // Load saved places from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedPlaces") || "[]");
    setSavedPlaces(saved);
  }, []);

  const handleAddPlace = () => {
    const placeName = prompt("Enter monument/place name:");
    if (placeName && placeName.trim()) {
      const newPlace = {
        id: Date.now(),
        name: placeName,
        category: "Monument",
        saved: new Date().toLocaleDateString(),
        rating: 0,
        notes: "",
      };
      const updated = [...savedPlaces, newPlace];
      setSavedPlaces(updated);
      localStorage.setItem("savedPlaces", JSON.stringify(updated));
    }
  };

  const handleRemovePlace = (id) => {
    const updated = savedPlaces.filter((place) => place.id !== id);
    setSavedPlaces(updated);
    localStorage.setItem("savedPlaces", JSON.stringify(updated));
  };

  const handleAddNote = (id) => {
    const note = prompt("Add notes for this place:");
    if (note !== null) {
      const updated = savedPlaces.map((place) =>
        place.id === id ? { ...place, notes: note } : place
      );
      setSavedPlaces(updated);
      localStorage.setItem("savedPlaces", JSON.stringify(updated));
    }
  };

  const handleRate = (id, rating) => {
    const updated = savedPlaces.map((place) =>
      place.id === id ? { ...place, rating } : place
    );
    setSavedPlaces(updated);
    localStorage.setItem("savedPlaces", JSON.stringify(updated));
  };

  const filteredPlaces =
    filter === "all"
      ? savedPlaces
      : savedPlaces.filter((place) => place.rating >= parseInt(filter));

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#0c1220] to-[#050810] p-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400 mb-2">
          Saved Places
        </h1>
        <p className="text-slate-400">
          {savedPlaces.length > 0
            ? `You have ${savedPlaces.length} saved place${savedPlaces.length !== 1 ? "s" : ""}`
            : "No saved places yet"}
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={handleAddPlace}
          className="px-6 py-2 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] transition"
        >
          ➕ Add Place
        </button>

        <div className="flex gap-2">
          {["all", "0", "3", "4", "5"].map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === r
                  ? "bg-lime-400/30 border border-lime-400 text-lime-300"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:border-lime-400/50"
              }`}
            >
              {r === "all" ? "All" : `${r}⭐+`}
            </button>
          ))}
        </div>
      </div>

      {/* Places Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-xl font-semibold text-slate-300 mb-2">
              No saved places
            </p>
            <p className="text-slate-400">
              Add monuments and places you want to revisit
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-lime-400/50 transition hover:shadow-lg hover:shadow-lime-400/10"
            >
              {/* Place Name */}
              <h3 className="text-lg font-bold text-lime-400 mb-2">
                {place.name}
              </h3>

              {/* Category Badge */}
              <p className="text-sm text-slate-400 mb-3">{place.category}</p>

              {/* Rating */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(place.id, star)}
                      className={`text-xl transition ${
                        star <= place.rating
                          ? "text-yellow-400"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <p className="text-xs text-lime-400 mt-1">{place.rating} out of 5</p>
              </div>

              {/* Notes */}
              {place.notes && (
                <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/5">
                  <p className="text-sm text-slate-300">{place.notes}</p>
                </div>
              )}

              {/* Date Saved */}
              <p className="text-xs text-slate-500 mb-4">
                Saved: {place.saved}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddNote(place.id)}
                  className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-400/50 text-blue-300 rounded-lg hover:bg-blue-500/30 transition text-sm font-semibold"
                >
                  📝 Note
                </button>
                <button
                  onClick={() => handleRemovePlace(place.id)}
                  className="flex-1 px-3 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg hover:bg-red-500/30 transition text-sm font-semibold"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Saved;
