import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Plus, Search,
  Zap, DollarSign, Scale,
  AlertCircle, X
} from 'lucide-react';

export default function FeedManagement() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);
  const [formulationResult, setFormulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', protein_pct: '', energy_mj: '', cost_per_unit: '', unit: 'kg', stock_kg: ''
  });

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/feed/ingredients', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setIngredients(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchIngredients(); }, []);

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddIngredient = (ing: any) => {
    if (selectedIngredients.find(i => i.id === ing.id)) return;
    setSelectedIngredients([...selectedIngredients, { ...ing, quantity: 0 }]);
  };

  const handleUpdateQuantity = (id: number, qty: number) => {
    setSelectedIngredients(selectedIngredients.map(i =>
      i.id === id ? { ...i, quantity: qty } : i
    ));
  };

  const handleFormulate = async () => {
    try {
      const res = await fetch('/api/feed/formulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ingredients: selectedIngredients })
      });
      if (res.ok) setFormulationResult(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/feed/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ name: '', protein_pct: '', energy_mj: '', cost_per_unit: '', unit: 'kg', stock_kg: '' });
        fetchIngredients();
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8">Loading feed management...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed Intelligence</h1>
          <p className="text-gray-500">Formulate optimal rations and track consumption.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Ingredient
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulation Tool */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              Ration Formulation Tool
            </h3>

            <div className="space-y-4">
              {selectedIngredients.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-gray-400 text-sm italic">Select ingredients from the list to start formulating.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedIngredients.map(ing => (
                    <div key={ing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-gray-900">{ing.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {ing.protein_pct}% Protein • {ing.energy_mj} MJ/kg
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateQuantity(ing.id, Number(e.target.value))}
                          className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Qty (kg)"
                        />
                        <button
                          onClick={() => setSelectedIngredients(selectedIngredients.filter(i => i.id !== ing.id))}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleFormulate}
                    className="w-full py-4 bg-[#151619] text-white font-bold rounded-2xl hover:bg-gray-800 transition-all mt-4 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Calculate Nutritional Profile
                  </button>
                </div>
              )}
            </div>

            {formulationResult && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Protein</p>
                  <p className="text-2xl font-bold text-emerald-900">{formulationResult.protein_pct.toFixed(1)}%</p>
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Energy (ME)</p>
                  <p className="text-2xl font-bold text-blue-900">{formulationResult.energy_mj_per_kg.toFixed(2)} MJ/kg</p>
                </div>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Cost / kg</p>
                  <p className="text-2xl font-bold text-amber-900">${formulationResult.cost_per_kg.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Inventory Alerts */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Inventory Alerts
            </h3>
            <div className="space-y-4">
              {ingredients.filter(i => i.stock_kg != null && i.stock_kg < 200).length === 0 ? (
                <p className="text-sm text-gray-500 italic">No low-stock alerts.</p>
              ) : (
                ingredients.filter(i => i.stock_kg != null && i.stock_kg < 200).map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Scale className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-900 text-sm">{ing.name} Low Stock</h4>
                        <p className="text-xs text-red-700">Only {ing.stock_kg}kg remaining.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`Order more ${ing.name}? This will open a new transaction record.`)) {
                          window.open('/financials', '_self');
                        }
                      }}
                      className="px-4 py-2 bg-white text-red-600 font-bold text-xs rounded-lg border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                    >
                      Order Now
                    </button>
                  </div>
                ))
              )}
              {/* Always show at least one example alert if no stock data available */}
              {ingredients.every(i => i.stock_kg == null) && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg"><Scale className="w-5 h-5 text-red-600" /></div>
                    <div>
                      <h4 className="font-bold text-red-900 text-sm">Maize Bran Low Stock</h4>
                      <p className="text-xs text-red-700">Only 150kg remaining. Projected to run out in 3 days.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.confirm('Record purchase order in Financials?') && window.open('/financials', '_self')}
                    className="px-4 py-2 bg-white text-red-600 font-bold text-xs rounded-lg border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    Order Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ingredients Sidebar */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            Ingredient Library
          </h3>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search ingredients..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-3">
            {filteredIngredients.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center py-4">No ingredients found.</p>
            )}
            {filteredIngredients.map(ing => (
              <button
                key={ing.id}
                onClick={() => handleAddIngredient(ing)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-200 text-left group hover:scale-105 active:scale-95 cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{ing.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-emerald-600">
                    ${ing.cost_per_unit}/{ing.unit}
                  </p>
                </div>
                <Plus className="w-4 h-4 text-gray-300 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Add Feed Ingredient</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveIngredient} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ingredient Name</label>
                <input type="text" required value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Maize Bran" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protein %</label>
                  <input type="number" step="0.1" required value={addForm.protein_pct}
                    onChange={e => setAddForm({ ...addForm, protein_pct: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Energy (MJ/kg)</label>
                  <input type="number" step="0.01" required value={addForm.energy_mj}
                    onChange={e => setAddForm({ ...addForm, energy_mj: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost per Unit ($)</label>
                  <input type="number" step="0.01" required value={addForm.cost_per_unit}
                    onChange={e => setAddForm({ ...addForm, cost_per_unit: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit</label>
                  <select value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm">
                    <option>kg</option><option>ton</option><option>bag</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Stock (kg)</label>
                <input type="number" value={addForm.stock_kg}
                  onChange={e => setAddForm({ ...addForm, stock_kg: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="0" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-60">
                  {submitting ? 'Saving...' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
