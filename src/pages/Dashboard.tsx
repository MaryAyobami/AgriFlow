import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Activity, AlertCircle, TrendingUp,
  CheckCircle2, Skull, Filter, Sparkles
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchInsights = async () => {
      try {
        const res = await fetch('/api/ai/insights', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setInsights(await res.json());
      } catch (err) {
        console.error("Insights fetch error:", err);
      }
    };

    fetchStats();
    fetchInsights();
  }, []);

  if (loading) return <div className="p-8">Loading intelligence dashboard...</div>;

  // Filter species distribution by selected species
  const filteredSpecies = speciesFilter === 'All'
    ? (stats?.speciesDistribution || [])
    : (stats?.speciesDistribution || []).filter((s: any) => s.species === speciesFilter);

  const summaryCards = [
    { title: 'Total Animals', value: stats?.totalAnimals || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Vaccination Compliance', value: `${stats?.vaccinationCompliance ?? '—'}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Mortality Rate', value: `${stats?.mortalityRate?.toFixed(1) || 0}%`, icon: Skull, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Active Incidents', value: stats?.activeIncidents ?? '—', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Farm Intelligence</h1>
          <p className="text-gray-500">Real-time operational overview and performance analytics.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 pr-8"
          >
            <option value="All">All animals</option>
            <option>Goats</option>
            <option>Cattle</option>
            <option>Sheep</option>
            <option>Camels</option>
            <option>Ostrich</option>
            <option>Poultry</option>
            <option>Guinea fowl</option>
          </select>
        </div>
      </div>

      {/* Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900">Herd Growth &amp; Projections</h3>
            <p className="text-xs text-gray-400 italic">Illustrative projection</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Jan', actual: 1200, projected: 1200 },
                { month: 'Feb', actual: 1350, projected: 1300 },
                { month: 'Mar', actual: 1480, projected: 1450 },
                { month: 'Apr', actual: 1620, projected: 1600 },
                { month: 'May', actual: 1850, projected: 1750 },
                { month: 'Jun', actual: null, projected: 2100 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="Actual" />
                <Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={false} name="Projected" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-full" /> Actual</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-full" /> Projected</div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-[#151619] p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-lg">AI Strategic Insights</h3>
            </div>
            <div className="space-y-4">
              {insights.length > 0 ? insights.map((insight, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{insight.priority} Priority</span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{insight.insight}</p>
                </div>
              )) : (
                <p className="text-sm text-gray-500 italic">Analyzing farm data for insights...</p>
              )}
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Generate Full Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Species Composition — filtered by dropdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">Herd Composition by Species</h3>
          {speciesFilter !== 'All' && (
            <p className="text-xs text-emerald-600 font-semibold mb-4">Filtered: {speciesFilter}</p>
          )}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredSpecies}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="species"
                >
                  {filteredSpecies.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Average Daily Gain (ADG) by Group</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { group: 'Weaners', adg: 0.45 },
                { group: 'Growers', adg: 0.62 },
                { group: 'Breeders', adg: 0.38 },
                { group: 'Mature', adg: 0.15 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="adg" fill="#10b981" radius={[4, 4, 0, 0]} name="ADG (kg/day)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
