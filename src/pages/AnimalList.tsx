import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, ChevronRight, 
  QrCode, MoreVertical, Download, Eye
} from 'lucide-react';
import { format } from 'date-fns';

export default function AnimalList() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await fetch('/api/animals', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setAnimals(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimals();
  }, []);

  const filteredAnimals = animals.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         a.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = speciesFilter === 'All' || a.species === speciesFilter;
    return matchesSearch && matchesSpecies;
  });

  if (loading) return <div className="p-8">Loading livestock registry...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livestock Registry</h1>
          <p className="text-gray-500">Manage and track all farm animals.</p>
        </div>
        <button 
          onClick={() => navigate('/animals/new')}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Register Animal
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by ID or breed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option>All</option>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Animal ID</th>
                <th className="px-6 py-4">Species & Breed</th>
                <th className="px-6 py-4">Sex</th>
                <th className="px-6 py-4">Age</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAnimals.map(animal => (
                <tr 
                  key={animal.id} 
                  className="hover:bg-gray-50 transition-all duration-200 cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => navigate(`/animals/${animal.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <span className="font-bold text-gray-900">{animal.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{animal.species}</div>
                      <div className="text-xs text-gray-500">{animal.breed}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{animal.sex}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(animal.dob), 'MMM yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      animal.status === 'Alive' ? 'bg-emerald-50 text-emerald-600' : 
                      animal.status === 'Sold' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {animal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/animals/${animal.id}`);
                        }}
                        className="p-2 text-gray-400 hover:text-emerald-500 transition-all hover:scale-110 active:scale-90"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('More options coming soon');
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-all hover:scale-110 active:scale-90"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAnimals.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900">No animals found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
