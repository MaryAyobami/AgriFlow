import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users,
  Activity, PieChart as PieChartIcon,
  ArrowUpRight, Download,
  Sparkles, ShieldCheck, AlertTriangle, XCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { downloadCSV } from '../utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

// Return a status badge icon based on animal status
function StatusBadge({ status }: { status: string }) {
  if (status === 'Alive' || !status) return <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"><ShieldCheck className="w-4 h-4" />Active &amp; Healthy</span>;
  if (status === 'Sold') return <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600"><ArrowUpRight className="w-4 h-4" />Sold</span>;
  if (status === 'Dead') return <span className="flex items-center gap-1.5 text-xs font-medium text-red-600"><XCircle className="w-4 h-4" />Deceased</span>;
  return <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600"><AlertTriangle className="w-4 h-4" />{status}</span>;
}

export default function InvestorPortal() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portRes, statsRes] = await Promise.all([
          fetch('/api/animals', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch('/api/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);
        if (portRes.ok) setPortfolio(await portRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading investor portfolio...</div>;

  // Estimated value: $3/kg of birth weight, min $150
  const estimateValue = (animal: any) => Math.max(150, (animal.birth_weight || 0) * 3);
  const totalValue = portfolio.reduce((acc, a) => acc + estimateValue(a), 0);
  const speciesData = portfolio.reduce((acc: any[], curr) => {
    const existing = acc.find(i => i.name === curr.species);
    if (existing) existing.value++;
    else acc.push({ name: curr.species, value: 1 });
    return acc;
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor Portfolio</h1>
          <p className="text-gray-500">Track your livestock investments and performance.</p>
        </div>
        <button
          onClick={() => downloadCSV(portfolio.map(a => ({ id: a.id, species: a.species, breed: a.breed, status: a.status, estimated_value: estimateValue(a) })), 'investor-statement.csv')}
          className="flex items-center gap-2 bg-[#151619] text-white px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-800 shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Download className="w-5 h-5" />
          Download Statement
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="w-24 h-24" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Portfolio Value</p>
          <p className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <ArrowUpRight className="w-4 h-4" />
            +18.4% this year
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Animals</p>
          <p className="text-3xl font-bold text-gray-900">{portfolio.length}</p>
          <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-sm">
            <Users className="w-4 h-4" />
            Across {speciesData.length} species
          </div>
        </div>
        <div className="bg-emerald-500 p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/20 hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer">
          <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Projected ROI</p>
          <p className="text-3xl font-bold">24.5%</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-100 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            Optimized by AI
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-8 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-blue-500" />
            Asset Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={speciesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {speciesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Performance */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Portfolio Growth
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Jan', value: 12000 },
                { month: 'Feb', value: 12500 },
                { month: 'Mar', value: 14200 },
                { month: 'Apr', value: 13800 },
                { month: 'May', value: 15600 },
                { month: 'Jun', value: 17800 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Your Assets ({portfolio.length})</h3>
          <button
            onClick={() => navigate('/animals')}
            className="text-sm font-bold text-emerald-600 hover:underline hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            View All Details →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Asset ID</th>
                <th className="px-6 py-4">Species</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Current Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {portfolio.map(animal => (
                <tr key={animal.id} className="hover:bg-gray-50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer" onClick={() => navigate(`/animals/${animal.id}`)}>
                  <td className="px-6 py-4 font-bold text-gray-900">{animal.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{animal.species} • {animal.breed}</td>
                  <td className="px-6 py-4"><StatusBadge status={animal.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-gray-900">${estimateValue(animal).toFixed(2)}</span>
                    <p className="text-[9px] text-gray-400">est.</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
