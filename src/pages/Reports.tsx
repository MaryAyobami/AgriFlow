import React, { useState, useEffect } from 'react';
import {
  FileText, Download, BarChart2,
  Activity, Zap, TrendingUp, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { downloadCSV } from '../utils';

const REPORT_TYPES = [
  { key: 'health', label: 'Health Incident Report', icon: Activity, color: 'text-red-500', bg: 'bg-red-50', desc: 'All health incidents grouped by date and severity.' },
  { key: 'feed', label: 'Feed Consumption Report', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Feed consumption and 30/90 day projections.' },
  { key: 'performance', label: 'Growth Performance Report', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Weight logs and ADG by group.' },
  { key: 'breeding', label: 'Breeding Cycle Report', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'All active and completed breeding cycles.' },
];

const DAYS_OPTIONS = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'All Time', value: 365 },
];

export default function Reports() {
  const [healthTrends, setHealthTrends] = useState<any[]>([]);
  const [feedProjections, setFeedProjections] = useState<any[]>([]);
  const [allHealth, setAllHealth] = useState<any[]>([]);
  const [allBreeding, setAllBreeding] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [htRes, fpRes, hRes, bRes] = await Promise.all([
        fetch(`/api/reports/health-trends?days=${selectedDays}`, { headers }),
        fetch('/api/reports/feed-projections', { headers }),
        fetch('/api/health-records', { headers }),
        fetch('/api/breeding', { headers }),
      ]);
      if (htRes.ok) setHealthTrends(await htRes.json());
      if (fpRes.ok) setFeedProjections(await fpRes.json());
      if (hRes.ok) setAllHealth(await hRes.json());
      if (bRes.ok) setAllBreeding(await bRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedDays]);

  const handleDownload = async (type: string) => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    switch (type) {
      case 'health':
        downloadCSV(allHealth, 'health-incidents-report.csv');
        break;
      case 'feed':
        downloadCSV(feedProjections, 'feed-projections-report.csv');
        break;
      case 'breeding':
        downloadCSV(allBreeding, 'breeding-records-report.csv');
        break;
      default:
        alert('Performance report requires weight data export — coming in next update.');
    }
  };

  const handleExportAll = () => {
    downloadCSV([...allHealth.map(h => ({ type: 'health', ...h })), ...allBreeding.map(b => ({ type: 'breeding', ...b }))], 'agriflow-all-data.csv');
  };

  if (loading) return <div className="p-8">Loading reports...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farm Intelligence Reports</h1>
          <p className="text-gray-500">Generate and export data-driven farm analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDays}
            onChange={e => setSelectedDays(Number(e.target.value))}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {DAYS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            Export All Data
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {REPORT_TYPES.map(report => (
          <div key={report.key} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className={`p-3 ${report.bg} rounded-xl w-fit mb-4`}>
              <report.icon className={`w-6 h-6 ${report.color}`} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{report.label}</h3>
            <p className="text-xs text-gray-500 mb-4">{report.desc}</p>
            <button
              onClick={() => handleDownload(report.key)}
              className={`flex items-center gap-2 text-xs font-bold ${report.color} hover:underline cursor-pointer`}
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Incident Trends */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-red-500" />
              Health Incident Trends
            </h3>
            <span className="text-xs text-gray-400">{DAYS_OPTIONS.find(d => d.value === selectedDays)?.label}</span>
          </div>
          <div className="h-[300px]">
            {healthTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p className="text-sm italic">No incidents in this period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="record_date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feed Projections */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              Feed Consumption Projections
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedProjections}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="ingredient_id" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="projected_30d" fill="#3b82f6" radius={[4, 4, 0, 0]} name="30-Day Projection (kg)" />
                <Bar dataKey="projected_90d" fill="#93c5fd" radius={[4, 4, 0, 0]} name="90-Day Projection (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
