import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Home,
  MapPin,
  PlusCircle,
  Edit3,
  Trash2,
  Save,
  X,
  Layers
} from 'lucide-react';

const initialMainPlaceState = {
  mainPlaceId: '',
  name: '',
  shortDescription: '',
  description: '',
  history: '',
  lat: '',
  lng: '',
  imageUrl: '',
  category: 'Heritage Site',
  district: '',
  state: '',
  entryFee: '',
  timings: '',
  highlights: '',
  distance: '',
  isPopular: false
};

const initialSubPlaceState = {
  monumentId: '',
  name: '',
  shortDescription: '',
  description: '',
  history: '',
  lat: '',
  lng: '',
  audioUrl: '',
  imageUrl: '',
  category: 'Cave',
  markerType: 'religious',
  timings: '',
  entryFee: '',
  highlights: '',
  isPopular: false,
  caveNumber: '',
  parentPlaceId: ''
};

const categoriesMain = ['Heritage Site', 'Temple', 'Fort', 'Museum', 'Park'];
const categoriesSub = ['Cave', 'Temple', 'Utility', 'Entry', 'Restaurant', 'Viewpoint'];
const markerOptions = [
  { value: 'religious', label: '🛕 Religious Marker' },
  { value: 'food', label: '🍽️ Food / Langar Marker' },
  { value: 'nature', label: '🌊 River / Nature Marker' },
  { value: 'history', label: '🏛️ Museum / History Marker' },
  { value: 'stay', label: '🛏️ Stay / Accommodation Marker' },
  { value: 'entry', label: '🚪 Entrance / Gate Marker' },
  { value: 'washroom', label: '🚻 Washroom Marker' },
  { value: 'water', label: '🚰 Drinking Water Marker' },
  { value: 'parking', label: '🚗 Parking Marker' },
  { value: 'current', label: '📍 Current Location Marker' },
  { value: 'highlight', label: '⭐ Featured / Important Spot' }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('main');
  const [mainPlaces, setMainPlaces] = useState([]);
  const [subPlaces, setSubPlaces] = useState([]);

  const [mainForm, setMainForm] = useState(initialMainPlaceState);
  const [subForm, setSubForm] = useState(initialSubPlaceState);

  const [editMainId, setEditMainId] = useState(null);
  const [editSubId, setEditSubId] = useState(null);

  const [selectedMainPlace, setSelectedMainPlace] = useState('');
  const [subplacesForSelected, setSubplacesForSelected] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mainRes, subRes] = await Promise.all([
        axios.get('http://localhost:5000/api/mainplaces'),
        axios.get('http://localhost:5000/api/monuments')
      ]);
      setMainPlaces(mainRes.data || []);
      setSubPlaces(subRes.data || []);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
      setMessage(err.response?.data?.error || err.message || 'Error loading data. Check backend status.');
    } finally {
      setLoading(false);
    }
  };

  const loadSubplacesForMainPlace = async (mainPlaceId) => {
    if (!mainPlaceId) {
      setSubplacesForSelected([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/mainplaces/${mainPlaceId}/monuments`);
      setSubplacesForSelected(res.data || []);
    } catch (err) {
      console.error('Failed to fetch subplaces', err);
      setSubplacesForSelected([]);
    }
  };

  const resetMessages = () => setMessage('');

  const handleMainChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMainForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'parentPlaceId') {
      setSelectedMainPlace(value);
      loadSubplacesForMainPlace(value);
    }
  };

  const handleMainSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    try {
      const payload = {
        ...mainForm,
        coordinates: { lat: parseFloat(mainForm.lat), lng: parseFloat(mainForm.lng) },
        highlights: mainForm.highlights ? mainForm.highlights.split(',').map((h) => h.trim()) : []
      };

      if (editMainId) {
        await axios.put(`http://localhost:5000/api/mainplaces/${editMainId}`, payload);
        setMessage('Main Place updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/mainplaces', payload);
        setMessage('Main Place created successfully');
      }

      setMainForm(initialMainPlaceState);
      setEditMainId(null);
      loadData();
    } catch (err) {
      console.error('Main place submit failed', err);
      setMessage(err.response?.data?.error || err.message || 'Failed to save Main Place');
    }
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    try {
      const payload = {
        ...subForm,
        coordinates: { lat: parseFloat(subForm.lat), lng: parseFloat(subForm.lng) },
        highlights: subForm.highlights ? subForm.highlights.split(',').map((h) => h.trim()) : [],
        markerType: subForm.markerType,
        parentPlaceId: subForm.parentPlaceId
      };

      if (!payload.parentPlaceId) {
        setMessage('Please select a Main Place for this Sub-place');
        return;
      }

      if (editSubId) {
        await axios.put(`http://localhost:5000/api/monuments/${editSubId}`, payload);
        setMessage('Sub-place updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/monuments', payload);
        setMessage('Sub-place created successfully');
      }

      setSubForm(initialSubPlaceState);
      setEditSubId(null);
      loadData();
    } catch (err) {
      console.error('Sub-place submit failed', err);
      setMessage(err.response?.data?.error || err.message || 'Failed to save Sub-place');
    }
  };

  const handleEditMain = (main) => {
    setEditMainId(main.mainPlaceId || main._id);
    setMainForm({
      mainPlaceId: main.mainPlaceId || '',
      name: main.name || '',
      shortDescription: main.shortDescription || '',
      description: main.description || '',
      history: main.history || '',
      lat: main.coordinates?.lat || '',
      lng: main.coordinates?.lng || '',
      imageUrl: main.imageUrl || '',
      category: main.category || 'Heritage Site',
      district: main.district || '',
      state: main.state || '',
      entryFee: main.entryFee || '',
      timings: main.timings || '',
      highlights: (main.highlights || []).join(', '),
      distance: main.distance || '',
      isPopular: main.isPopular || false
    });
    setActiveTab('main');
  };

  const handleEditSub = (sub) => {
    setEditSubId(sub.monumentId || sub._id);
    setSelectedMainPlace(sub.parentPlaceId);
    loadSubplacesForMainPlace(sub.parentPlaceId);
    setSubForm({
      monumentId: sub.monumentId || '',
      name: sub.name || '',
      shortDescription: sub.shortDescription || '',
      description: sub.description || '',
      history: sub.history || '',
      lat: sub.coordinates?.lat || '',
      lng: sub.coordinates?.lng || '',
      audioUrl: sub.audioUrl || '',
      imageUrl: sub.imageUrl || '',
      category: sub.category || 'Cave',
      markerType: sub.markerType || 'religious',
      timings: sub.timings || '',
      entryFee: sub.entryFee || '',
      highlights: (sub.highlights || []).join(', '),
      isPopular: sub.isPopular || false,
      caveNumber: sub.caveNumber || '',
      parentPlaceId: sub.parentPlaceId || ''
    });
    setActiveTab('sub');
  };

  const handleDeleteMain = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/mainplaces/${id}`);
      setMessage('Main Place deleted');
      loadData();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || err.message || 'Failed to delete Main Place');
    }
  };

  const handleDeleteSub = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/monuments/${id}`);
      setMessage('Sub-place deleted');
      loadData();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || err.message || 'Failed to delete Sub-place');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 p-4">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-500/30 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col xl:flex-row gap-4">
          <aside className="w-full xl:w-72 rounded-2xl border border-lime-400/30 bg-slate-900/50 p-4 backdrop-blur-md">
            <h2 className="mb-4 text-2xl font-bold text-lime-300">SmartNav Admin</h2>
            <p className="mb-6 text-sm text-slate-300">Total Main Places: {mainPlaces.length} · Sub-places: {subPlaces.length}</p>
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('main')}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium ${activeTab === 'main' ? 'bg-lime-500/30 text-lime-200' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/70'}`}>
                <Home size={18} /> Manage Main Places
              </button>
              <button
                onClick={() => setActiveTab('sub')}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium ${activeTab === 'sub' ? 'bg-lime-500/30 text-lime-200' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/70'}`}>
                <MapPin size={18} /> Manage Sub-places
              </button>
            </nav>
          </aside>

          <main className="flex-1 rounded-2xl border border-lime-400/30 bg-slate-900/50 p-4 backdrop-blur-md">
            {message && <div className="mb-4 rounded-xl border border-lime-500/60 bg-lime-500/10 px-3 py-2 text-lime-200">{message}</div>}
            {loading ? (
              <div className="text-center text-lg text-slate-200">Loading data...</div>
            ) : (
              <>
                {activeTab === 'main' ? (
                  <section>
                    <h3 className="mb-3 text-xl font-bold text-lime-300">Add / Edit Main Place</h3>
                    <form onSubmit={handleMainSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input name="mainPlaceId" value={mainForm.mainPlaceId} onChange={handleMainChange} placeholder="Main Place ID" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 placeholder-slate-400" required />
                      <input name="name" value={mainForm.name} onChange={handleMainChange} placeholder="Name" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required />
                      <input name="shortDescription" value={mainForm.shortDescription} onChange={handleMainChange} placeholder="Short Description" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <select name="category" value={mainForm.category} onChange={handleMainChange} className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100">
                        {categoriesMain.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input name="district" value={mainForm.district} onChange={handleMainChange} placeholder="District" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="state" value={mainForm.state} onChange={handleMainChange} placeholder="State" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="timings" value={mainForm.timings} onChange={handleMainChange} placeholder="Timings" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="entryFee" value={mainForm.entryFee} onChange={handleMainChange} placeholder="Entry Fee" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="lat" value={mainForm.lat} onChange={handleMainChange} placeholder="Latitude" type="number" step="any" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required />
                      <input name="lng" value={mainForm.lng} onChange={handleMainChange} placeholder="Longitude" type="number" step="any" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required />
                      <input name="imageUrl" value={mainForm.imageUrl} onChange={handleMainChange} placeholder="Image URL" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="distance" value={mainForm.distance} onChange={handleMainChange} placeholder="Distance (km)" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="highlights" value={mainForm.highlights} onChange={handleMainChange} placeholder="Highlights (comma-separated)" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <textarea name="description" value={mainForm.description} onChange={handleMainChange} placeholder="Description" className="col-span-2 min-h-[80px] rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100"></textarea>
                      <textarea name="history" value={mainForm.history} onChange={handleMainChange} placeholder="History" className="col-span-2 min-h-[80px] rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100"></textarea>

                      <label className="col-span-2 flex items-center gap-3 text-slate-200">
                        <input type="checkbox" name="isPopular" checked={mainForm.isPopular} onChange={handleMainChange} className="h-4 w-4 text-lime-400" />
                        Popular
                      </label>

                      <div className="col-span-2 flex gap-2">
                        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-4 py-2 font-semibold text-slate-950 hover:bg-lime-400">
                          <Save size={16} /> Save Main Place
                        </button>
                        <button type="button" onClick={() => {setMainForm(initialMainPlaceState); setEditMainId(null); setMessage('');}} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-slate-300 hover:border-lime-500">
                          <X size={16} /> Clear
                        </button>
                      </div>
                    </form>

                    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-sm">
                      <h4 className="mb-2 font-semibold text-lime-200">Main Places List</h4>
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="text-xs uppercase text-slate-400">
                            <th className="px-2 py-1">Name</th>
                            <th className="px-2 py-1">Category</th>
                            <th className="px-2 py-1">District</th>
                            <th className="px-2 py-1">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mainPlaces.map((place) => (
                            <tr key={place.mainPlaceId || place._id} className="border-y border-slate-700 hover:bg-slate-800/70">
                              <td className="px-2 py-1">{place.name}</td>
                              <td className="px-2 py-1">{place.category}</td>
                              <td className="px-2 py-1">{place.district}</td>
                              <td className="flex flex-wrap gap-2 px-2 py-1">
                                <button title="Edit" onClick={() => handleEditMain(place)} className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"><Edit3 size={14} /> </button>
                                <button title="Delete" onClick={() => handleDeleteMain(place.mainPlaceId || place._id)} className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"><Trash2 size={14} /> </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : (
                  <section>
                    <h3 className="mb-3 text-xl font-bold text-lime-300">Add / Edit Sub-place (Monument)</h3>
                    <form onSubmit={handleSubSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input name="monumentId" value={subForm.monumentId} onChange={handleSubChange} placeholder="Monument ID" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required />
                      <input name="name" value={subForm.name} onChange={handleSubChange} placeholder="Name" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required />
                      <select name="parentPlaceId" value={subForm.parentPlaceId} onChange={handleSubChange} className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required>
                        <option value="">-- Select Main Place --</option>
                        {mainPlaces.map((main) => (
                          <option key={main.mainPlaceId || main._id} value={main.mainPlaceId || main._id}>
                            {main.name}
                          </option>
                        ))}
                      </select>
                      <select name="category" value={subForm.category} onChange={handleSubChange} className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100">
                        {categoriesSub.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>

                      <select name="markerType" value={subForm.markerType} onChange={handleSubChange} className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required>
                        {markerOptions.map((marker) => (
                          <option key={marker.value} value={marker.value}>{marker.label}</option>
                        ))}
                      </select>

                      <input name="shortDescription" value={subForm.shortDescription} onChange={handleSubChange} placeholder="Short Description" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="timings" value={subForm.timings} onChange={handleSubChange} placeholder="Timings" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="entryFee" value={subForm.entryFee} onChange={handleSubChange} placeholder="Entry Fee" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="lat" value={subForm.lat} onChange={handleSubChange} placeholder="Latitude" type="number" step="any" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required />
                      <input name="lng" value={subForm.lng} onChange={handleSubChange} placeholder="Longitude" type="number" step="any" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" required />
                      <input name="audioUrl" value={subForm.audioUrl} onChange={handleSubChange} placeholder="Audio URL" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="imageUrl" value={subForm.imageUrl} onChange={handleSubChange} placeholder="Image URL" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="caveNumber" value={subForm.caveNumber} onChange={handleSubChange} placeholder="Cave Number" type="number" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <input name="highlights" value={subForm.highlights} onChange={handleSubChange} placeholder="Highlights (comma-separated)" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100" />
                      <textarea name="description" value={subForm.description} onChange={handleSubChange} placeholder="Description" className="col-span-2 min-h-[80px] rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100"></textarea>
                      <textarea name="history" value={subForm.history} onChange={handleSubChange} placeholder="History" className="col-span-2 min-h-[80px] rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100"></textarea>

                      <label className="col-span-2 flex items-center gap-3 text-slate-200">
                        <input type="checkbox" name="isPopular" checked={subForm.isPopular} onChange={handleSubChange} className="h-4 w-4 text-lime-400" />
                        Popular
                      </label>

                      <div className="col-span-2 flex gap-2">
                        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-4 py-2 font-semibold text-slate-950 hover:bg-lime-400">
                          <Save size={16} /> Save Sub-place
                        </button>
                        <button type="button" onClick={() => {setSubForm(initialSubPlaceState); setEditSubId(null); setMessage(''); setSelectedMainPlace(''); setSubplacesForSelected([]);}} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-slate-300 hover:border-lime-500">
                          <X size={16} /> Clear
                        </button>
                      </div>
                    </form>

                    {selectedMainPlace && (
                      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm">
                        <h4 className="mb-2 font-semibold text-lime-200">
                          Existing Sub-places for {mainPlaces.find(m => (m._id || m.mainPlaceId) === selectedMainPlace)?.name || 'Selected Main Place'}
                        </h4>
                        {subplacesForSelected.length > 0 ? (
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="text-xs uppercase text-slate-400">
                                <th className="px-2 py-1">Name</th>
                                <th className="px-2 py-1">Category</th>
                                <th className="px-2 py-1">Marker</th>
                                <th className="px-2 py-1">Cave #</th>
                                <th className="px-2 py-1">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subplacesForSelected.map((sub) => (
                                <tr key={sub._id || sub.monumentId} className="border-y border-slate-700 hover:bg-slate-800/70">
                                  <td className="px-2 py-1">{sub.name}</td>
                                  <td className="px-2 py-1">{sub.category}</td>
                                  <td className="px-2 py-1">{sub.markerType || 'religious'}</td>
                                  <td className="px-2 py-1">{sub.caveNumber || 'N/A'}</td>
                                  <td className="flex flex-wrap gap-2 px-2 py-1">
                                    <button title="Edit" onClick={() => handleEditSub(sub)} className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"><Edit3 size={14} /></button>
                                    <button title="Delete" onClick={() => handleDeleteSub(sub._id || sub.monumentId)} className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"><Trash2 size={14} /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-slate-400">No sub-places found for this main place. Add the first one above!</p>
                        )}
                      </div>
                    )}

                    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-sm">
                      <h4 className="mb-2 font-semibold text-lime-200">Sub-places List</h4>
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="text-xs uppercase text-slate-400">
                            <th className="px-2 py-1">Name</th>
                            <th className="px-2 py-1">Main Place</th>
                            <th className="px-2 py-1">Category</th>
                            <th className="px-2 py-1">Marker</th>
                            <th className="px-2 py-1">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subPlaces.map((sub) => {
                            const parent = mainPlaces.find((m) => m._id === sub.parentPlaceId || m.mainPlaceId === sub.parentPlaceId);
                            return (
                              <tr key={sub._id || sub.monumentId} className="border-y border-slate-700 hover:bg-slate-800/70">
                                <td className="px-2 py-1">{sub.name}</td>
                                <td className="px-2 py-1">{parent?.name || 'Unknown'}</td>
                                <td className="px-2 py-1">{sub.category}</td>
                                <td className="px-2 py-1">{sub.markerType || 'religious'}</td>
                                <td className="flex flex-wrap gap-2 px-2 py-1">
                                  <button title="Edit" onClick={() => handleEditSub(sub)} className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"><Edit3 size={14} /></button>
                                  <button title="Delete" onClick={() => handleDeleteSub(sub._id || sub.monumentId)} className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"><Trash2 size={14} /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}