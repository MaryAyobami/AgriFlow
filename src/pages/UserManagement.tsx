import React, { useState, useEffect } from 'react';
import { Check, X, UserCog, Shield, UserCheck, Trash2, UserPlus } from 'lucide-react';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string | null;
  approved: number;
  email?: string;
  phone?: string;
  department?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '', password: '', fullName: '', email: '', phone: '', role: 'Farm Staff', department: ''
  });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: number, role: string) => {
    try {
      const res = await fetch(`/api/users/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Reject this user request? They will not be deleted but cannot log in.')) return;
    try {
      const res = await fetch(`/api/users/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleUpdateRole = async (id: number, role: string) => {
    try {
      const res = await fetch(`/api/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ role }),
      });
      if (res.ok) fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ username: '', password: '', fullName: '', email: '', phone: '', role: 'Farm Staff', department: '' });
        fetchUsers();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  if (loading) return <div className="p-8">Loading users...</div>;

  const pendingUsers = users.filter(u => !u.approved);
  const activeUsers = users.filter(u => u.approved);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-gray-500">Approve new profiles, manage roles and create users.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          Create User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <Shield className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Pending Approvals */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <UserCog className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-gray-900">Pending Approvals ({pendingUsers.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-500 italic">No pending requests.</div>
          ) : (
            pendingUsers.map(user => (
              <div key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{user.full_name}</h4>
                    <p className="text-sm text-gray-500">@{user.username} • {user.role}</p>
                    <p className="text-xs text-gray-400">{user.email} • {user.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    id={`role-${user.id}`}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    defaultValue={user.role || 'Farm Staff'}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Farm Manager">Farm Manager</option>
                    <option value="Veterinary Officer">Veterinary Officer</option>
                    <option value="Farm Staff">Farm Staff</option>
                    <option value="Investor">Investor</option>
                  </select>
                  <button
                    onClick={() => {
                      const role = (document.getElementById(`role-${user.id}`) as HTMLSelectElement).value;
                      handleApprove(user.id, role);
                    }}
                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all hover:scale-110 active:scale-90"
                    title="Approve"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all hover:scale-110 active:scale-90"
                    title="Reject (soft — user not deleted)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Active Users ({activeUsers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.department}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        defaultValue={user.role || ''}
                        onChange={e => handleUpdateRole(user.id, e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={user.username === 'admin'}
                        title="Change role"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Farm Manager">Farm Manager</option>
                        <option value="Veterinary Officer">Veterinary Officer</option>
                        <option value="Farm Staff">Farm Staff</option>
                        <option value="Investor">Investor</option>
                      </select>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-all hover:scale-110 active:scale-90"
                        disabled={user.username === 'admin'}
                        title="Delete user permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Create New User
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name *</label>
                  <input type="text" required value={createForm.fullName}
                    onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username *</label>
                  <input type="text" required value={createForm.username}
                    onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email *</label>
                  <input type="email" required value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                  <input type="tel" value={createForm.phone}
                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role *</label>
                  <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm">
                    <option>Admin</option>
                    <option>Farm Manager</option>
                    <option>Veterinary Officer</option>
                    <option>Farm Staff</option>
                    <option>Investor</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</label>
                  <input type="text" value={createForm.department}
                    onChange={e => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password *</label>
                <input type="password" required value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-60">
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
