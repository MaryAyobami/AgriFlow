import React, { useState, useEffect } from 'react';
import {
  Heart, Plus, Activity, CheckCircle2, Clock,
  TrendingUp, Calendar, AlertCircle, X
} from 'lucide-react';
import { format } from 'date-fns';
import { daysSince } from '../utils';

interface BreedingRecord {
  id: number;
  dam_id: string;
  sire_id: string;
  mating_date: string;
  expected_due_date: string;
  status: string;
  pd_status: string;
  notes: string;
}

export default function BreedingManagement() {
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatingModal, setShowMatingModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [matingForm, setMatingForm] = useState({
    dam_id: '',
    sire_id: '',
    mating_date: new Date().toISOString().split('T')[0],
    expected_due_date: '',
    notes: '',
  });

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/breeding', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setRecords(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleRecordMating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/breeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(matingForm),
      });
      if (res.ok) {
        setShowMatingModal(false);
        setMatingForm({ dam_id: '', sire_id: '', mating_date: new Date().toISOString().split('T')[0], expected_due_date: '', notes: '' });
        fetchRecords();
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/breeding/${editingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          status: editingRecord.status,
          pd_status: editingRecord.pd_status,
          expected_due_date: editingRecord.expected_due_date,
          notes: editingRecord.notes,
        }),
      });
      if (res.ok) { setShowUpdateModal(false); setEditingRecord(null); fetchRecords(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8">Loading breeding records...</div>;

  const displayedRecords = showAll ? records : records.slice(0, 5);

  // Upcoming due dates sorted for the "calendar" view
  const upcoming = [...records]
    .filter(r => r.expected_due_date)
    .sort((a, b) => new Date(a.expected_due_date).getTime() - new Date(b.expected_due_date).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Breeding &amp; Genetics</h1>
          <p className="text-gray-500">Manage breeding cycles, heat detection, and pedigree tracking.</p>
        </div>
        <button
          onClick={() => setShowMatingModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Record Mating
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Breeding Records */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-emerald-500" />
                Active Breeding Cycles
              </h3>
              {records.length > 5 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  {showAll ? 'Show Less' : `View All (${records.length})`}
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {records.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic">No active breeding cycles.</div>
              ) : (
                displayedRecords.map(record => (
                  <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Activity className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">Dam: {record.dam_id} × Sire: {record.sire_id}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${record.status === 'Pregnant' ? 'bg-emerald-50 text-emerald-600' :
                                record.status === 'Pending PD' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                              {record.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Mating Date: <span className="font-bold">{format(new Date(record.mating_date), 'MMM d, yyyy')}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Expected Due Date</p>
                        <p className="text-sm font-bold text-gray-900">
                          {record.expected_due_date ? format(new Date(record.expected_due_date), 'MMM d, yyyy') : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pl-14">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          Days Since Mating: <span className="text-gray-900 font-bold">{daysSince(record.mating_date)} days</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          PD Status: <span className="text-gray-900 font-bold">{record.pd_status || 'Pending'}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => { setEditingRecord(record); setShowUpdateModal(true); }}
                        className="text-emerald-600 text-xs font-bold hover:underline hover:text-emerald-700 transition-all cursor-pointer"
                      >
                        Update Record
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Due Dates (replaces alert stubs) */}
          <div className="bg-[#151619] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Breeding Calendar
              </h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No upcoming due dates.</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(r => (
                    <div key={r.id} className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                          {format(new Date(r.expected_due_date), 'MMM d, yyyy')}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${r.status === 'Pregnant' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>{r.status}</span>
                      </div>
                      <p className="text-sm font-bold">Dam {r.dam_id} × Sire {r.sire_id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Genetic Insights */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Genetic Insights
            </h3>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-bold">Recommendation:</span> Sire SR-012 shows high growth performance in offspring. Consider using for next breeding cycle with Dam GT-045.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Record Mating Modal */}
      {showMatingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Record Mating Event</h3>
              <button onClick={() => setShowMatingModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRecordMating} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dam ID (Mother)</label>
                  <input type="text" required value={matingForm.dam_id}
                    onChange={e => setMatingForm({ ...matingForm, dam_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. GT-001" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sire ID (Father)</label>
                  <input type="text" required value={matingForm.sire_id}
                    onChange={e => setMatingForm({ ...matingForm, sire_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. SR-012" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mating Date</label>
                  <input type="date" required value={matingForm.mating_date}
                    onChange={e => setMatingForm({ ...matingForm, mating_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expected Due Date</label>
                  <input type="date" value={matingForm.expected_due_date}
                    onChange={e => setMatingForm({ ...matingForm, expected_due_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</label>
                <textarea value={matingForm.notes} rows={2}
                  onChange={e => setMatingForm({ ...matingForm, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Optional observations..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMatingModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60">
                  {submitting ? 'Saving...' : 'Record Mating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Record Modal */}
      {showUpdateModal && editingRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Update Breeding Record</h3>
              <button onClick={() => { setShowUpdateModal(false); setEditingRecord(null); }} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateRecord} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                  <select value={editingRecord.status}
                    onChange={e => setEditingRecord({ ...editingRecord, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm">
                    <option>Pending PD</option><option>Pregnant</option><option>Not Pregnant</option><option>Delivered</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PD Status</label>
                  <select value={editingRecord.pd_status || ''}
                    onChange={e => setEditingRecord({ ...editingRecord, pd_status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm">
                    <option value="">Pending</option><option>Positive</option><option>Negative</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expected Due Date</label>
                <input type="date" value={editingRecord.expected_due_date || ''}
                  onChange={e => setEditingRecord({ ...editingRecord, expected_due_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</label>
                <textarea value={editingRecord.notes || ''} rows={2}
                  onChange={e => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowUpdateModal(false); setEditingRecord(null); }}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
