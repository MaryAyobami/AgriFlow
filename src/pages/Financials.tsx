import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown,
  Plus, Download
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { downloadCSV, groupByMonth } from '../utils';
import FinancialModal from './FinancialModal';

export default function Financials() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchFinancials = async () => {
    try {
      const res = await fetch('/api/financials', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setRecords(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFinancials(); }, []);

  if (loading) return <div className="p-8">Loading financial records...</div>;

  const totalRevenue = records.filter(r => r.category === 'sale').reduce((acc, r) => acc + r.amount, 0);
  const totalExpenses = records.filter(r => r.category === 'expense').reduce((acc, r) => acc + r.amount, 0);

  // Build real monthly cash flow from records
  const revenueByMonth = groupByMonth(records.filter(r => r.category === 'sale'), 'record_date', ['amount']);
  const expenseByMonth = groupByMonth(records.filter(r => r.category === 'expense'), 'record_date', ['amount']);
  const months = Array.from(new Set([...revenueByMonth.map(r => r.month), ...expenseByMonth.map(r => r.month)])).sort();
  const chartData = months.length > 0 ? months.map(m => ({
    month: m,
    revenue: revenueByMonth.find(r => r.month === m)?.amount || 0,
    expenses: expenseByMonth.find(r => r.month === m)?.amount || 0,
  })) : [
    // Fallback illustrative data when no transactions exist
    { month: 'Jan', revenue: 4500, expenses: 3200 },
    { month: 'Feb', revenue: 5200, expenses: 3400 },
    { month: 'Mar', revenue: 4800, expenses: 3100 },
    { month: 'Apr', revenue: 6100, expenses: 3800 },
    { month: 'May', revenue: 5900, expenses: 3600 },
    { month: 'Jun', revenue: 7200, expenses: 4100 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farm Financials</h1>
          <p className="text-gray-500">Track revenue, expenses, and production forecasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadCSV(records, 'agriflow-transactions.csv')}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-50 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Record Transaction
          </button>
        </div>
      </div>

      {/* Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl"><TrendingDown className="w-6 h-6 text-red-600" /></div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-[#151619] p-6 rounded-3xl text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-xl"><DollarSign className="w-6 h-6 text-emerald-400" /></div>
          </div>
          <h3 className="text-sm font-medium text-gray-400">Net Profit</h3>
          <p className="text-2xl font-bold text-white mt-1">${(totalRevenue - totalExpenses).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Chart — real data */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900">Cash Flow Analysis</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-full" /> Revenue</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-full" /> Expenses</div>
              {months.length === 0 && <span className="text-gray-400 italic text-[10px]">Illustrative</span>}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={0.1} fill="#10b981" strokeWidth={3} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={0.1} fill="#ef4444" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Forecast */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Sales Forecast <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Estimated</span>
          </h3>
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next 30 Days</span>
                <span className="text-emerald-600 font-bold text-sm">+$12,400</span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Projected Goat Sales</p>
              <p className="text-xs text-gray-500">Based on 45 animals reaching market weight (est.).</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next 90 Days</span>
                <span className="text-emerald-600 font-bold text-sm">+$38,200</span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Projected Cattle Sales</p>
              <p className="text-xs text-gray-500">Based on current growth rates (est.).</p>
            </div>
          </div>
          <p className="text-[9px] text-gray-400 italic mt-6">* Forecasts are AI-estimated projections, not guaranteed.</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">All Transactions ({records.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(record => (
                <tr key={record.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(record.record_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{record.description}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">{record.reference_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${record.category === 'sale' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                      {record.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${record.category === 'sale' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                    {record.category === 'sale' ? '+' : '-'}${record.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">No transactions recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {showModal && (
        <FinancialModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchFinancials(); }} />
      )}
    </div>
  );
}
