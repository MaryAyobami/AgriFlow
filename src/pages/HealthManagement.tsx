import React, { useState, useEffect } from 'react';
import {
  Activity, Plus, ShieldAlert,
  AlertCircle, CheckCircle2, Clock,
  Stethoscope, ChevronRight, X
} from 'lucide-react';
import { format } from 'date-fns';

interface Incident {
  id: number;
  animal_id: string;
  incident_date: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  severity: 'Low' | 'Medium' | 'High';
  status: string;
}

interface Vaccination {
  id: number;
  animal_id: string;
  vaccine_name: string;
  due_date: string;
  status: string;
  species: string;
}

export default function HealthManagement() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showVacModal, setShowVacModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [incidentForm, setIncidentForm] = useState({
    animal_id: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    severity: 'Medium' as 'Low' | 'Medium' | 'High',
  });
  const [vacForm, setVacForm] = useState({
    animal_id: '',
    vaccine_name: '',
    dose: '',
    scheduled_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchData = async () => {
    try {
      const [incRes, vacRes] = await Promise.all([
        fetch('/api/health-records', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/vaccinations/pending', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      if (incRes.ok) setIncidents(await incRes.json());
      if (vacRes.ok) setVaccinations(await vacRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/health/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(incidentForm),
      });
      if (res.ok) {
        setShowIncidentModal(false);
        setIncidentForm({ animal_id: '', symptoms: '', diagnosis: '', treatment: '', severity: 'Medium' });
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/health-records/${editingIncident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          diagnosis: editingIncident.diagnosis,
          treatment: editingIncident.treatment,
          severity: editingIncident.severity,
          status: editingIncident.status,
        }),
      });
      if (res.ok) { setShowUpdateModal(false); setEditingIncident(null); fetchData(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleMarkVaccinationDone = async (id: number) => {
    try {
      await fetch(`/api/vaccinations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'Completed', administered_date: new Date().toISOString().split('T')[0] }),
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleScheduleVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(vacForm),
      });
      if (res.ok) {
        setShowVacModal(false);
        setVacForm({ animal_id: '', vaccine_name: '', dose: '', scheduled_date: '' });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to schedule vaccination');
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8">Loading health records...</div>;

  const displayedIncidents = showAll ? incidents : incidents.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health &amp; Biosecurity</h1>
          <p className="text-gray-500">Monitor herd health, treatments, and biosecurity protocols.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVacModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Schedule Vaccination
          </button>
          <button
            onClick={() => setShowIncidentModal(true)}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-5 h-5" />
            Report Incident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Health Incidents */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                Recent Health Incidents
              </h3>
              {incidents.length > 5 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  {showAll ? 'Show Less' : `View All (${incidents.length})`}
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {displayedIncidents.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic">No recent health incidents reported.</div>
              ) : (
                displayedIncidents.map(incident => (
                  <div key={incident.id} className="p-6 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${incident.severity === 'High' ? 'bg-red-50 text-red-500' :
                          incident.severity === 'Medium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                          }`}>
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">{incident.diagnosis || 'Pending Diagnosis'}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${incident.severity === 'High' ? 'bg-red-50 text-red-600' :
                              incident.severity === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                              {incident.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Animal: <span className="font-bold">{incident.animal_id}</span> • Symptoms: {incident.symptoms}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(incident.incident_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between pl-14">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          Status: <span className="text-gray-900 font-bold">{incident.status}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Treatment: <span className="text-gray-900 font-bold">{incident.treatment || 'None'}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => { setEditingIncident(incident); setShowUpdateModal(true); }}
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

        {/* Vaccination Schedule */}
        <div className="space-y-6">
          <div className="bg-[#151619] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldAlert className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Vaccination Schedule
              </h3>
              <div className="space-y-4">
                {vaccinations.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No pending vaccinations.</p>
                ) : (
                  vaccinations.map(vac => (
                    <div key={vac.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Due: {format(new Date(vac.due_date), 'MMM d')}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded uppercase">Pending</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{vac.vaccine_name}</h4>
                      <p className="text-xs text-gray-400">Animal: <span className="text-white">{vac.animal_id}</span> ({vac.species})</p>
                      <button
                        onClick={() => handleMarkVaccinationDone(vac.id)}
                        className="w-full mt-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setShowVacModal(true)}
                className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                + Schedule New Vaccination
              </button>
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-3 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                View All Incidents
              </button>
            </div>
          </div>

          {/* Biosecurity Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Biosecurity Alerts
            </h3>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-bold">Regional Alert:</span> Increased reports of PPR in neighboring farms. Ensure all goats are vaccinated and restrict visitor access to pens.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Report Health Incident
              </h3>
              <button onClick={() => setShowIncidentModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleReportIncident} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Animal ID / Tag</label>
                <input
                  type="text" required value={incidentForm.animal_id}
                  onChange={e => setIncidentForm({ ...incidentForm, animal_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-sm"
                  placeholder="e.g. GT-2023-001"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Symptoms</label>
                <textarea
                  required value={incidentForm.symptoms} rows={2}
                  onChange={e => setIncidentForm({ ...incidentForm, symptoms: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-sm"
                  placeholder="Describe observed symptoms..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnosis</label>
                  <input
                    type="text" value={incidentForm.diagnosis}
                    onChange={e => setIncidentForm({ ...incidentForm, diagnosis: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-sm"
                    placeholder="Diagnosis (if known)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Severity</label>
                  <select
                    value={incidentForm.severity}
                    onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Treatment Administered</label>
                <input
                  type="text" value={incidentForm.treatment}
                  onChange={e => setIncidentForm({ ...incidentForm, treatment: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-sm"
                  placeholder="e.g. Oxytetracycline 10ml"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowIncidentModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Report Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Record Modal */}
      {showUpdateModal && editingIncident && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Update Health Record</h3>
              <button onClick={() => { setShowUpdateModal(false); setEditingIncident(null); }} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateIncident} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Severity</label>
                  <select
                    value={editingIncident.severity}
                    onChange={e => setEditingIncident({ ...editingIncident, severity: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                  >
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                  <select
                    value={editingIncident.status}
                    onChange={e => setEditingIncident({ ...editingIncident, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                  >
                    <option>Open</option><option>In Treatment</option><option>Resolved</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnosis</label>
                <input type="text" value={editingIncident.diagnosis || ''}
                  onChange={e => setEditingIncident({ ...editingIncident, diagnosis: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Treatment</label>
                <input type="text" value={editingIncident.treatment || ''}
                  onChange={e => setEditingIncident({ ...editingIncident, treatment: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowUpdateModal(false); setEditingIncident(null); }}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Vaccination Modal */}
      {showVacModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Schedule Vaccination
              </h3>
              <button onClick={() => setShowVacModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleScheduleVaccination} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Animal ID / Tag *</label>
                  <input
                    type="text" required value={vacForm.animal_id}
                    onChange={e => setVacForm({ ...vacForm, animal_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm"
                    placeholder="e.g. GT-001"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scheduled Date *</label>
                  <input
                    type="date" required value={vacForm.scheduled_date}
                    onChange={e => setVacForm({ ...vacForm, scheduled_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vaccine Name *</label>
                <input
                  type="text" required value={vacForm.vaccine_name}
                  onChange={e => setVacForm({ ...vacForm, vaccine_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm"
                  placeholder="e.g. PPR Vaccine, FMD Vaccine"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dose / Quantity</label>
                <input
                  type="text" value={vacForm.dose}
                  onChange={e => setVacForm({ ...vacForm, dose: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm"
                  placeholder="e.g. 2ml subcutaneous"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowVacModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60">
                  {submitting ? 'Scheduling...' : 'Schedule Vaccination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
