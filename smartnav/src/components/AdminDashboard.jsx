import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Home,
  MapPin,
  PlusCircle,
  Edit3,
  Trash2,
  Save,
  X,
  Layers,
  BarChart2,
  QrCode
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
  isPopular: false,
  visitDuration: '',
  images: ''
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
  parentPlaceId: '',
  visitDuration: '',
  crowdLevel: 'medium',
  images: ''
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
  const authConfig = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Refs for scrolling
  const mainFormRef = useRef(null);
  const subFormRef = useRef(null);

  const [activeTab, setActiveTab] = useState('main');
  const [mainPlaces, setMainPlaces] = useState([]);
  const [subPlaces, setSubPlaces] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [topMonuments, setTopMonuments] = useState([]);
  const [qrMonumentId, setQrMonumentId] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);

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
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [summaryRes, topRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/summary'),
        axios.get('http://localhost:5000/api/analytics/top-monuments')
      ]);
      setAnalytics(summaryRes.data);
      setTopMonuments(topRes.data || []);
    } catch (err) {
      console.error('Analytics load failed', err);
    }
  };

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
        highlights: mainForm.highlights ? mainForm.highlights.split(',').map((h) => h.trim()) : [],
        images: mainForm.images ? mainForm.images.split(',').map((img) => img.trim()) : [],
        visitDuration: mainForm.visitDuration ? parseInt(mainForm.visitDuration, 10) : undefined
      };

      if (editMainId) {
        await axios.put(`http://localhost:5000/api/mainplaces/${editMainId}`, payload, authConfig());
        setMessage('Main Place updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/mainplaces', payload, authConfig());
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
        images: subForm.images ? subForm.images.split(',').map((img) => img.trim()) : [],
        markerType: subForm.markerType,
        parentPlaceId: subForm.parentPlaceId,
        visitDuration: subForm.visitDuration ? parseInt(subForm.visitDuration, 10) : undefined,
        crowdLevel: subForm.crowdLevel
      };

      if (!payload.parentPlaceId) {
        setMessage('Please select a Main Place for this Sub-place');
        return;
      }

      if (editSubId) {
        await axios.put(`http://localhost:5000/api/monuments/${editSubId}`, payload, authConfig());
        setMessage('Sub-place updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/monuments', payload, authConfig());
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
      isPopular: main.isPopular || false,
      visitDuration: main.visitDuration || '',
      images: (main.images || []).join(', ')
    });
    setActiveTab('main');
    // Scroll to form after state update
    setTimeout(() => {
      mainFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
      parentPlaceId: sub.parentPlaceId || '',
      visitDuration: sub.visitDuration || '',
      crowdLevel: sub.crowdLevel || 'medium',
      images: (sub.images || []).join(', ')
    });
    setActiveTab('sub');
    // Scroll to form after state update
    setTimeout(() => {
      subFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteMain = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/mainplaces/${id}`, authConfig());
      setMessage('Main Place deleted');
      loadData();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || err.message || 'Failed to delete Main Place');
    }
  };

  const handleDeleteSub = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/monuments/${id}`, authConfig());
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
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium ${activeTab === 'analytics' ? 'bg-lime-500/30 text-lime-200' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/70'}`}>
                <BarChart2 size={18} /> Analytics
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium ${activeTab === 'qr' ? 'bg-lime-500/30 text-lime-200' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/70'}`}>
                <QrCode size={18} /> QR Generator
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
                  <section className="flex flex-col gap-6">
                    {/* Main Layout: Table on left/top, Form on right/bottom */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Table Section */}
                      <div className="flex-1 lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm shadow-xl">
                          <h3 className="mb-4 text-lg font-bold text-lime-300">📋 Existing Main Places</h3>
                          {mainPlaces.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                              <p>No main places found in the database.</p>
                              <p className="text-xs mt-2">Click the form below to add your first main place.</p>
                            </div>
                          ) : (
                            <table className="w-full border-collapse text-left">
                              <thead>
                                <tr className="text-xs uppercase text-slate-400 bg-slate-800/50 sticky top-0 z-10">
                                  <th className="px-3 py-2 rounded-tl-lg">Name</th>
                                  <th className="px-3 py-2">Category</th>
                                  <th className="px-3 py-2">District</th>
                                  <th className="px-3 py-2 rounded-tr-lg">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {mainPlaces.map((place) => (
                                  <tr key={place.mainPlaceId || place._id} className="border-b border-slate-700/50 hover:bg-slate-800/70 transition-colors">
                                    <td className="px-3 py-2 font-medium text-white">{place.name}</td>
                                    <td className="px-3 py-2 text-slate-300">{place.category}</td>
                                    <td className="px-3 py-2 text-slate-300">{place.district}</td>
                                    <td className="flex flex-wrap gap-2 px-3 py-2">
                                      <button title="Edit" onClick={() => handleEditMain(place)} className="rounded-md bg-blue-600/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors border border-blue-500/50 flex items-center gap-1.5"><Edit3 size={14} /> Edit</button>
                                      <button title="Delete" onClick={() => handleDeleteMain(place.mainPlaceId || place._id)} className="rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition-colors border border-red-500/50 flex items-center gap-1.5"><Trash2 size={14} /></button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                      {/* Form Section */}
                      <div ref={mainFormRef} className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
                        <h3 className="mb-4 text-lg font-bold text-lime-300 flex items-center gap-2">
                          {editMainId ? '✏️ Edit Main Place' : '➕ Add New Main Place'}
                          {editMainId && <span className="text-xs bg-blue-600/50 px-2 py-1 rounded text-blue-200">Editing</span>}
                        </h3>
                        <form onSubmit={handleMainSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <input name="mainPlaceId" value={mainForm.mainPlaceId} onChange={handleMainChange} placeholder="Main Place ID (e.g. nanded-fort)" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 placeholder-slate-400 focus:border-lime-400 focus:outline-none transition" required />
                          <input name="name" value={mainForm.name} onChange={handleMainChange} placeholder="Name" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" required />
                          <input name="shortDescription" value={mainForm.shortDescription} onChange={handleMainChange} placeholder="Short Description" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <select name="category" value={mainForm.category} onChange={handleMainChange} className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition">
                            {categoriesMain.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input name="district" value={mainForm.district} onChange={handleMainChange} placeholder="District" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="state" value={mainForm.state} onChange={handleMainChange} placeholder="State" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="timings" value={mainForm.timings} onChange={handleMainChange} placeholder="Timings" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="entryFee" value={mainForm.entryFee} onChange={handleMainChange} placeholder="Entry Fee" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="lat" value={mainForm.lat} onChange={handleMainChange} placeholder="Latitude" type="number" step="any" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" required />
                          <input name="lng" value={mainForm.lng} onChange={handleMainChange} placeholder="Longitude" type="number" step="any" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" required />
                          <input name="imageUrl" value={mainForm.imageUrl} onChange={handleMainChange} placeholder="Image URL" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="distance" value={mainForm.distance} onChange={handleMainChange} placeholder="Distance (km)" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="visitDuration" value={mainForm.visitDuration} onChange={handleMainChange} placeholder="Estimated Visit Duration (minutes)" type="number" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="highlights" value={mainForm.highlights} onChange={handleMainChange} placeholder="Highlights (comma-separated)" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="images" value={mainForm.images} onChange={handleMainChange} placeholder="Additional Images (comma-separated URLs)" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <textarea name="description" value={mainForm.description} onChange={handleMainChange} placeholder="Description" className="col-span-2 min-h-[80px] rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition resize-none"></textarea>
                          <textarea name="history" value={mainForm.history} onChange={handleMainChange} placeholder="History" className="col-span-2 min-h-[80px] rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition resize-none"></textarea>

                          <label className="col-span-2 flex items-center gap-3 text-slate-200 cursor-pointer hover:text-lime-300 transition">
                            <input type="checkbox" name="isPopular" checked={mainForm.isPopular} onChange={handleMainChange} className="h-4 w-4 text-lime-400 cursor-pointer" />
                            Mark as Popular
                          </label>

                          <div className="col-span-2 flex gap-2 mt-4">
                            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-6 py-3 font-black text-slate-950 hover:bg-lime-400 transition transform hover:scale-105 shadow-xl shadow-lime-500/20">
                              <Save size={18} /> {editMainId ? 'Update Place' : 'Save New Place'}
                            </button>
                            <button type="button" onClick={() => {setMainForm(initialMainPlaceState); setEditMainId(null); setMessage('');}} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-6 py-3 font-bold text-slate-300 hover:border-lime-500 hover:text-lime-300 transition">
                              <X size={18} /> Clear
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="flex flex-col gap-6">
                    {/* Sub-places Layout */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Table Section */}
                      <div className="flex-1 lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm shadow-xl">
                          <h3 className="mb-4 text-lg font-bold text-lime-300">📋 All Existing Sub-places</h3>
                          {subPlaces.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                              <p>No sub-places found in the database.</p>
                              <p className="text-xs mt-2">Create a main place first, then add sub-places.</p>
                            </div>
                          ) : (
                            <table className="w-full border-collapse text-left">
                              <thead>
                                <tr className="text-xs uppercase text-slate-400 bg-slate-800/50 sticky top-0 z-10">
                                  <th className="px-3 py-2 rounded-tl-lg">Name</th>
                                  <th className="px-3 py-2">Main Place</th>
                                  <th className="px-3 py-2">Category</th>
                                  <th className="px-3 py-2 rounded-tr-lg">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subPlaces.map((sub) => {
                                  const parent = mainPlaces.find((m) => m._id === sub.parentPlaceId || m.mainPlaceId === sub.parentPlaceId);
                                  return (
                                    <tr key={sub._id || sub.monumentId} className="border-b border-slate-700/50 hover:bg-slate-800/70 transition-colors">
                                      <td className="px-3 py-2 font-medium text-white">{sub.name}</td>
                                      <td className="px-3 py-2 text-slate-300">{parent?.name || 'Unknown'}</td>
                                      <td className="px-3 py-2 text-slate-300">{sub.category}</td>
                                      <td className="flex flex-wrap gap-2 px-3 py-2">
                                        <button title="Edit" onClick={() => handleEditSub(sub)} className="rounded-md bg-blue-600/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors border border-blue-500/50 flex items-center gap-1.5"><Edit3 size={14} /> Edit</button>
                                        <button title="Delete" onClick={() => handleDeleteSub(sub._id || sub.monumentId)} className="rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition-colors border border-red-500/50 flex items-center gap-1.5"><Trash2 size={14} /></button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {selectedMainPlace && (
                          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm mt-4 shadow-xl">
                            <h4 className="mb-2 font-semibold text-lime-200">
                              📍 Sub-places for: <span className="text-lime-300">{mainPlaces.find(m => (m._id || m.mainPlaceId) === selectedMainPlace)?.name || 'Selected Place'}</span>
                            </h4>
                            {subplacesForSelected.length === 0 ? (
                              <p className="text-slate-400 py-4">No sub-places for this main place. Add one using the form →</p>
                            ) : (
                              <table className="w-full border-collapse text-left">
                                <thead>
                                  <tr className="text-xs uppercase text-slate-400 bg-slate-800/50 sticky top-0 z-10">
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Category</th>
                                    <th className="px-3 py-2">Marker</th>
                                    <th className="px-3 py-2">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subplacesForSelected.map((sub) => (
                                    <tr key={sub._id || sub.monumentId} className="border-b border-slate-700/50 hover:bg-slate-800/70">
                                      <td className="px-3 py-2 text-white">{sub.name}</td>
                                      <td className="px-3 py-2 text-slate-300">{sub.category}</td>
                                      <td className="px-3 py-2 text-slate-300">{sub.markerType || 'religious'}</td>
                                      <td className="flex flex-wrap gap-2 px-3 py-2">
                                        <button title="Edit" onClick={() => handleEditSub(sub)} className="rounded-md bg-blue-600/80 px-2 py-1 text-xs text-white hover:bg-blue-500 flex items-center gap-1"><Edit3 size={14} /></button>
                                        <button title="Delete" onClick={() => handleDeleteSub(sub._id || sub.monumentId)} className="rounded-md bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-500 flex items-center gap-1"><Trash2 size={14} /></button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Form Section */}
                      <div ref={subFormRef} className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
                        <h3 className="mb-4 text-lg font-bold text-lime-300 flex items-center gap-2">
                          {editSubId ? '✏️ Edit Sub-place' : '➕ Add New Sub-place'}
                          {editSubId && <span className="text-xs bg-blue-600/50 px-2 py-1 rounded text-blue-200">Editing</span>}
                        </h3>
                        <form onSubmit={handleSubSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <input name="monumentId" value={subForm.monumentId} onChange={handleSubChange} placeholder="Monument ID" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" required />
                          <input name="name" value={subForm.name} onChange={handleSubChange} placeholder="Name" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" required />
                          
                          <select name="parentPlaceId" value={subForm.parentPlaceId} onChange={handleSubChange} className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition font-semibold" required>
                            <option value="">-- Select Main Place (REQUIRED) --</option>
                            {mainPlaces.map((main) => (
                              <option key={main.mainPlaceId || main._id} value={main.mainPlaceId || main._id}>
                                {main.name}
                              </option>
                            ))}
                          </select>

                          <select name="category" value={subForm.category} onChange={handleSubChange} className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition">
                            {categoriesSub.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>

                          <select name="markerType" value={subForm.markerType} onChange={handleSubChange} className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" required>
                            {markerOptions.map((marker) => (
                              <option key={marker.value} value={marker.value}>{marker.label}</option>
                            ))}
                          </select>

                          <input name="shortDescription" value={subForm.shortDescription} onChange={handleSubChange} placeholder="Short Description" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="timings" value={subForm.timings} onChange={handleSubChange} placeholder="Timings" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="entryFee" value={subForm.entryFee} onChange={handleSubChange} placeholder="Entry Fee" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="lat" value={subForm.lat} onChange={handleSubChange} placeholder="Latitude" type="number" step="any" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" required />
                          <input name="lng" value={subForm.lng} onChange={handleSubChange} placeholder="Longitude" type="number" step="any" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" required />
                          <input name="audioUrl" value={subForm.audioUrl} onChange={handleSubChange} placeholder="Audio URL" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="imageUrl" value={subForm.imageUrl} onChange={handleSubChange} placeholder="Image URL" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="caveNumber" value={subForm.caveNumber} onChange={handleSubChange} placeholder="Cave Number (if applicable)" type="number" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <select name="crowdLevel" value={subForm.crowdLevel} onChange={handleSubChange} className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition">
                            <option value="low">🟢 Low Crowd</option>
                            <option value="medium">🟡 Medium Crowd</option>
                            <option value="high">🔴 High Crowd</option>
                          </select>
                          <input name="highlights" value={subForm.highlights} onChange={handleSubChange} placeholder="Highlights (comma-separated)" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="images" value={subForm.images} onChange={handleSubChange} placeholder="Additional Images (comma-separated URLs)" className="col-span-2 rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <input name="visitDuration" value={subForm.visitDuration} onChange={handleSubChange} placeholder="Visit Duration (minutes)" type="number" className="rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition" />
                          <textarea name="description" value={subForm.description} onChange={handleSubChange} placeholder="Description" className="col-span-2 min-h-[80px] rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition resize-none"></textarea>
                          <textarea name="history" value={subForm.history} onChange={handleSubChange} placeholder="History" className="col-span-2 min-h-[80px] rounded-xl border border-slate-600 bg-slate-800/60 p-2 text-slate-100 focus:border-lime-400 focus:outline-none transition resize-none"></textarea>

                          <label className="col-span-2 flex items-center gap-3 text-slate-200 cursor-pointer hover:text-lime-300 transition">
                            <input type="checkbox" name="isPopular" checked={subForm.isPopular} onChange={handleSubChange} className="h-4 w-4 text-lime-400 cursor-pointer" />
                            Mark as Popular
                          </label>

                          <div className="col-span-2 flex gap-2 mt-4">
                            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-6 py-3 font-black text-slate-950 hover:bg-lime-400 transition transform hover:scale-105 shadow-xl shadow-lime-500/20">
                              <Save size={18} /> {editSubId ? 'Update Sub-place' : 'Save New Sub-place'}
                            </button>
                            <button type="button" onClick={() => {setSubForm(initialSubPlaceState); setEditSubId(null); setMessage(''); setSelectedMainPlace(''); setSubplacesForSelected([]);}} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-6 py-3 font-bold text-slate-300 hover:border-lime-500 hover:text-lime-300 transition">
                              <X size={18} /> Clear
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </section>
                )}
              {activeTab === 'analytics' && (
                <section>
                  <h3 className="mb-4 text-xl font-bold text-lime-300">📊 Analytics Dashboard</h3>
                  {analytics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: 'Total Places', value: analytics.totalPlaces, icon: '🏛️', color: 'from-blue-600 to-blue-800' },
                        { label: 'Total Monuments', value: analytics.totalMonuments, icon: '📍', color: 'from-green-600 to-green-800' },
                        { label: 'Total Visits', value: analytics.totalVisits, icon: '👥', color: 'from-purple-600 to-purple-800' },
                        { label: 'Total Ratings', value: analytics.totalRatings, icon: '⭐', color: 'from-yellow-600 to-yellow-800' },
                      ].map((stat) => (
                        <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 text-center`}>
                          <div className="text-3xl mb-2">{stat.icon}</div>
                          <p className="text-3xl font-black text-white">{stat.value}</p>
                          <p className="text-slate-300 text-xs mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 className="text-lg font-bold text-lime-200 mb-3">🏆 Most Visited Monuments</h4>
                  {topMonuments.length === 0 ? (
                    <p className="text-slate-400">No visit data yet. Visitors need to open monument details to track visits.</p>
                  ) : (
                    <div className="space-y-3">
                      {topMonuments.map((m, idx) => (
                        <div key={m.monumentId} className="flex items-center gap-4 bg-slate-800/60 rounded-xl p-3">
                          <span className="text-lime-400 font-black text-lg w-6">#{idx + 1}</span>
                          {m.imageUrl && <img src={m.imageUrl} alt={m.name} className="w-12 h-12 rounded-lg object-cover" onError={(e)=>{e.target.style.display='none'}} />}
                          <div className="flex-1">
                            <p className="text-white font-bold">{m.name}</p>
                            <p className="text-slate-400 text-xs">{m.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lime-300 font-black">{m.visitCount} visits</p>
                            {m.averageRating > 0 && <p className="text-yellow-400 text-xs">★ {m.averageRating?.toFixed(1)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <button onClick={loadAnalytics} className="px-4 py-2 bg-lime-500/20 border border-lime-500/50 rounded-xl text-lime-300 font-bold hover:bg-lime-500/30 transition text-sm">
                      🔄 Refresh Analytics
                    </button>
                  </div>
                </section>
              )}

              {activeTab === 'qr' && (
                <section>
                  <h3 className="mb-4 text-xl font-bold text-lime-300">📱 QR Code Generator</h3>
                  <p className="text-slate-400 text-sm mb-4">Generate QR codes for monuments. When scanned, they open the monument details in SmartNav.</p>

                  <div className="mb-4">
                    <label className="text-slate-300 text-sm font-bold block mb-2">Select Monument</label>
                    <select
                      value={qrMonumentId}
                      onChange={(e) => { setQrMonumentId(e.target.value); setQrGenerated(false); }}
                      className="w-full rounded-xl border border-slate-600 bg-slate-800/60 p-3 text-slate-100"
                    >
                      <option value="">-- Select a monument --</option>
                      {subPlaces.map((m) => (
                        <option key={m.monumentId} value={m.monumentId}>{m.name} ({m.monumentId})</option>
                      ))}
                    </select>
                  </div>

                  {qrMonumentId && (
                    <div className="text-center space-y-4">
                      <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://localhost:3000/?id=${qrMonumentId}`)}`}
                          alt={`QR for ${qrMonumentId}`}
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-slate-300 text-sm">Monument ID: <span className="text-lime-300 font-bold">{qrMonumentId}</span></p>
                      <p className="text-slate-400 text-xs">Scan this QR to open monument details in SmartNav</p>
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`http://localhost:3000/?id=${qrMonumentId}`)}`}
                        download={`qr-${qrMonumentId}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-6 py-3 bg-lime-500 text-slate-950 font-black rounded-xl hover:bg-lime-400 transition"
                      >
                        ⬇️ Download QR Code
                      </a>
                    </div>
                  )}
                </section>
              )}

              </>)}
          </main>
        </div>
      </div>
    </div>
  );
}