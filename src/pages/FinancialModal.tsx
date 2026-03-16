import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

export default function FinancialModal({ onClose, onSaved }: Props) {
    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: 'expense' as 'sale' | 'expense',
        record_date: new Date().toISOString().split('T')[0],
        reference_id: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/financials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                onSaved();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save transaction');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Record Transaction
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                        <input type="text" required value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Sold 5 goats to market" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount ($)</label>
                            <input type="number" step="0.01" required value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                                placeholder="0.00" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm">
                                <option value="sale">Sale (Revenue)</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</label>
                            <input type="date" required value={form.record_date}
                                onChange={e => setForm({ ...form, record_date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference ID</label>
                            <input type="text" value={form.reference_id}
                                onChange={e => setForm({ ...form, reference_id: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                                placeholder="INV-001 (optional)" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Cancel</button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60">
                            {submitting ? 'Saving...' : 'Save Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
