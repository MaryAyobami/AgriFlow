import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Dog, Calendar, 
  MapPin, User, Heart, TrendingUp,
  Camera, Info
} from 'lucide-react';

export default function AnimalRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [investors, setInvestors] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    species: 'Goats',
    breed: '',
    dam_id: '',
    sire_id: '',
    dob: new Date().toISOString().split('T')[0],
    sex: 'Female',
    birth_weight: '',
    location: '',
    status: 'Alive',
    photo_url: '',
    investor_id: ''
  });

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const res = await fetch('/api/investors', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          setInvestors(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInvestors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          ...formData,
          birth_weight: formData.birth_weight ? Number(formData.birth_weight) : null,
          investor_id: formData.investor_id ? Number(formData.investor_id) : null
        })
      });

      if (res.ok) {
        navigate('/animals');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to register animal');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/animals')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all duration-200 font-medium hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Registry
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-emerald-500 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Dog className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Register New Livestock</h1>
              <p className="text-emerald-100 text-sm">Add a new animal to the farm intelligence system.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Info className="w-5 h-5 text-emerald-500" />
                Basic Information
              </h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Animal ID / Tag Number</label>
                <input 
                  type="text"
                  required
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. GT-2023-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Species</label>
                  <select 
                    value={formData.species}
                    onChange={(e) => setFormData({...formData, species: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option>Goats</option>
                    <option>Cattle</option>
                    <option>Sheep</option>
                    <option>Camels</option>
                    <option>Ostrich</option>
                    <option>Poultry</option>
                    <option>Guinea fowl</option>
                    <option>Other livestock</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sex</label>
                  <select 
                    value={formData.sex}
                    onChange={(e) => setFormData({...formData, sex: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Breed</label>
                <input 
                  type="text"
                  required
                  value={formData.breed}
                  onChange={(e) => setFormData({...formData, breed: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Boer, Kalahari Red"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="date"
                      required
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Birth Weight (kg)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.birth_weight}
                    onChange={(e) => setFormData({...formData, birth_weight: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Pedigree & Management */}
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Pedigree & Management
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dam ID (Mother)</label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      value={formData.dam_id}
                      onChange={(e) => setFormData({...formData, dam_id: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Tag #"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sire ID (Father)</label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      value={formData.sire_id}
                      onChange={(e) => setFormData({...formData, sire_id: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Tag #"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location / Paddock</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Paddock A, Section 4"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assign to Investor</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={formData.investor_id}
                    onChange={(e) => setFormData({...formData, investor_id: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">No Investor Assigned</option>
                    {investors.map(i => (
                      <option key={i.id} value={i.id}>{i.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Photo URL (Optional)</label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => navigate('/animals')}
              className="px-8 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Registering...' : 'Register Animal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
