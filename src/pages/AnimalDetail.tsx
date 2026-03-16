import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, QrCode, Activity, Heart,
  Stethoscope, ClipboardList, Plus,
  TrendingUp, Calendar, MapPin, User, X, Save
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<any>(null);
  const [weights, setWeights] = useState<any[]>([]);
  const [tabData, setTabData] = useState<{ health: any[], breeding: any[], vaccinations: any[] }>({ health: [], breeding: [], vaccinations: [] });
  const [loading, setLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [activeTab, setActiveTab] = useState('health');
  const [editForm, setEditForm] = useState<any>({});
  const [eventForm, setEventForm] = useState({ symptoms: '', diagnosis: '', treatment: '', severity: 'Medium' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [animalRes, weightRes, healthRes, breedingRes, vacRes] = await Promise.all([
        fetch(`/api/animals/${id}`, { headers }),
        fetch(`/api/animals/${id}/weights`, { headers }),
        fetch(`/api/animals/${id}/health`, { headers }),
        fetch(`/api/animals/${id}/breeding`, { headers }),
        fetch(`/api/animals/${id}/vaccinations`, { headers }),
      ]);
      if (animalRes.ok) {
        const a = await animalRes.json();
        setAnimal(a);
        setEditForm(a);
      }
      if (weightRes.ok) setWeights(await weightRes.json());
      setTabData({
        health: healthRes.ok ? await healthRes.json() : [],
        breeding: breedingRes.ok ? await breedingRes.json() : [],
        vaccinations: vacRes.ok ? await vacRes.json() : [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ animal_id: id, weight: Number(newWeight), log_date: new Date().toISOString() })
      });
      if (res.ok) { setShowWeightModal(false); setNewWeight(''); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/animals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { setShowEditModal(false); fetchData(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleEventSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/health/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ animal_id: id, ...eventForm }),
      });
      if (res.ok) { setShowEventModal(false); setEventForm({ symptoms: '', diagnosis: '', treatment: '', severity: 'Medium' }); fetchData(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8">Loading animal profile...</div>;
  if (!animal) return <div className="p-8">Animal not found.</div>;

  const adg = weights.length > 1
    ? (weights[weights.length - 1].weight - weights[0].weight) /
    ((new Date(weights[weights.length - 1].log_date).getTime() - new Date(weights[0].log_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const tabs = [
    { key: 'health', label: 'Health History', data: tabData.health },
    { key: 'breeding', label: 'Breeding Logs', data: tabData.breeding },
    { key: 'vaccinations', label: 'Vaccinations', data: tabData.vaccinations },
  ];

  const currentTab = tabs.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/animals')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-medium hover:scale-105 active:scale-95 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          Back to Registry
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Record Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${animal.status === 'Alive' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                {animal.status}
              </span>
            </div>
            <div className="w-32 h-32 bg-gray-100 rounded-3xl mx-auto mb-6 flex items-center justify-center border-4 border-white shadow-xl">
              <QRCodeSVG value={animal.id} size={100} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{animal.id}</h2>
            <p className="text-gray-500 font-medium">{animal.species} • {animal.breed}</p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-gray-50 rounded-2xl text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sex</p>
                <p className="font-bold text-gray-900">{animal.sex}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Born</p>
                <p className="font-bold text-gray-900">{format(new Date(animal.dob), 'MMM yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              Pedigree &amp; Location
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 flex items-center gap-2"><Heart className="w-4 h-4" /> Dam (Mother)</span>
                <span className="text-sm font-bold text-gray-900">{animal.dam_id || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Sire (Father)</span>
                <span className="text-sm font-bold text-gray-900">{animal.sire_id || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</span>
                <span className="text-sm font-bold text-gray-900">{animal.location}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 flex items-center gap-2"><User className="w-4 h-4" /> Investor</span>
                <span className="text-sm font-bold text-gray-900">{animal.investor_id || 'None'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance & History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weight Chart */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-gray-900">Growth Performance</h3>
                <p className="text-xs text-gray-500">Average Daily Gain: <span className="text-emerald-600 font-bold">{adg.toFixed(2)} kg/day</span></p>
              </div>
              <button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all font-bold text-sm hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Record Weight
              </button>
            </div>
            <div className="h-[300px]">
              {weights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Activity className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">No weight records yet.</p>
                  <button onClick={() => setShowWeightModal(true)} className="text-emerald-600 text-sm font-bold hover:underline">
                    Record the first weight →
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weights}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="log_date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(d) => format(new Date(d), 'MMM d')} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelFormatter={(d) => format(new Date(d), 'PPP')} />
                    <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-8 py-4 text-sm font-bold transition-all cursor-pointer ${activeTab === tab.key ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab.label} {tab.data.length > 0 ? `(${tab.data.length})` : ''}
                </button>
              ))}
            </div>
            <div className="p-8">
              {currentTab.data.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm italic">No {currentTab.label.toLowerCase()} on record for this animal.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Health tab */}
                  {activeTab === 'health' && tabData.health.map((h: any) => (
                    <div key={h.id} className="flex gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{h.diagnosis || 'Pending Diagnosis'}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg ${h.severity === 'High' ? 'bg-red-50 text-red-600' : h.severity === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>{h.severity}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{h.symptoms}</p>
                        <p className="text-xs text-gray-400">{format(new Date(h.incident_date), 'MMM d, yyyy')} • Treatment: {h.treatment || 'None'}</p>
                      </div>
                    </div>
                  ))}
                  {/* Breeding tab */}
                  {activeTab === 'breeding' && tabData.breeding.map((b: any) => (
                    <div key={b.id} className="flex gap-4">
                      <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Dam: {b.dam_id} × Sire: {b.sire_id}</h4>
                        <p className="text-sm text-gray-600">Status: {b.status} • PD: {b.pd_status || 'Pending'}</p>
                        <p className="text-xs text-gray-400">Mating: {format(new Date(b.mating_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  ))}
                  {/* Vaccinations tab */}
                  {activeTab === 'vaccinations' && tabData.vaccinations.map((v: any) => (
                    <div key={v.id} className="flex gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{v.vaccine_name}</h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${v.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{v.status}</span>
                        {v.administered_date && <p className="text-xs text-gray-400 mt-1">Date: {format(new Date(v.administered_date), 'MMM d, yyyy')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Record New Weight</h3>
            <form onSubmit={handleAddWeight} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weight (kg)</label>
                <input type="number" step="0.01" value={newWeight} onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0.00" required autoFocus />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowWeightModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit"
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Edit Animal Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleEditSave} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Breed', key: 'breed' },
                  { label: 'Location', key: 'location' },
                  { label: 'Dam ID', key: 'dam_id' },
                  { label: 'Sire ID', key: 'sire_id' },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f.label}</label>
                    <input type="text" value={editForm[f.key] || ''}
                      onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm">
                    <option>Alive</option><option>Sold</option><option>Dead</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sex</label>
                  <select value={editForm.sex} onChange={e => setEditForm({ ...editForm, sex: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm">
                    <option>Female</option><option>Male</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />{submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Record Health Event</h3>
              <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleEventSave} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Symptoms</label>
                <textarea required rows={2} value={eventForm.symptoms}
                  onChange={e => setEventForm({ ...eventForm, symptoms: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Describe symptoms..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnosis</label>
                  <input type="text" value={eventForm.diagnosis}
                    onChange={e => setEventForm({ ...eventForm, diagnosis: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Severity</label>
                  <select value={eventForm.severity} onChange={e => setEventForm({ ...eventForm, severity: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm">
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Treatment</label>
                <input type="text" value={eventForm.treatment}
                  onChange={e => setEventForm({ ...eventForm, treatment: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Oxytetracycline 10ml" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEventModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-60">
                  {submitting ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
