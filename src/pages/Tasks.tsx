import React, { useState, useEffect, useContext } from 'react';
import {
  CheckCircle2, Clock, AlertCircle, Plus,
  Trash2, Edit2, User, Calendar, Filter,
  Check, X
} from 'lucide-react';
import { format } from 'date-fns';
import { AuthContext } from '../App';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  due_date: string;
  assigned_to: number;
  assigned_to_name: string;
}

export default function Tasks() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as const,
    due_date: format(new Date(), 'yyyy-MM-dd'),
    assigned_to: user?.id || 0
  });

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setTasks(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      // Non-admins might fail this, but we can fallback to just the current user
      setUsers([{ id: user.id, full_name: user.fullName }]);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === 'Admin' || user.role === 'Farm Manager') {
      fetchUsers();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = editingTask ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingTask(null);
        setFormData({
          title: '',
          description: '',
          priority: 'Medium',
          due_date: format(new Date(), 'yyyy-MM-dd'),
          assigned_to: user?.id || 0
        });
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      assigned_to: task.assigned_to
    });
    setShowModal(true);
  };

  if (loading) return <div className="p-8">Loading tasks...</div>;

  // Apply filters
  const filteredTasks = tasks.filter(t => {
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (assigneeFilter && !t.assigned_to_name?.toLowerCase().includes(assigneeFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-500">Track and manage farm operations and staff assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all text-sm border ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              } hover:scale-105 active:scale-95 cursor-pointer`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          {(user.role === 'Admin' || user.role === 'Farm Manager') && (
            <button
              onClick={() => {
                setEditingTask(null);
                setFormData({
                  title: '',
                  description: '',
                  priority: 'Medium',
                  due_date: format(new Date(), 'yyyy-MM-dd'),
                  assigned_to: user?.id || 0
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="All">All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignee</label>
            <input type="text" value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}
              placeholder="Search name..."
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-40" />
          </div>
          <button onClick={() => { setPriorityFilter('All'); setAssigneeFilter(''); }}
            className="text-xs text-gray-400 hover:text-red-500 font-bold ml-auto cursor-pointer">Clear Filters</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(status => {
          const statusTasks = filteredTasks.filter(t => t.status === status);
          return (
            <div key={status} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 min-h-[400px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'Completed' ? 'bg-emerald-500' :
                    status === 'In Progress' ? 'bg-blue-500' :
                      status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                  {status} ({statusTasks.length})
                </h3>
              </div>
              <div className="space-y-4">
                {statusTasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${task.priority === 'High' ? 'bg-red-50 text-red-600' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {task.priority}
                      </span>
                      {(user.role === 'Admin' || user.role === 'Farm Manager') && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(task)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(task.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{task.title}</h4>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{task.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600" title={task.assigned_to_name}>
                          {task.assigned_to_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {task.status !== 'Completed' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'Completed')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all hover:scale-110 active:scale-90"
                            title="Mark as Completed"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {task.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'In Progress')}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-500 hover:text-white transition-all hover:scale-110 active:scale-90"
                            title="Start Task"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  placeholder="e.g., Repair North Fence"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  placeholder="Provide details about the task..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>
              {(user.role === 'Admin' || user.role === 'Farm Manager') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assign To</label>
                  <select
                    value={formData.assigned_to}
                    onChange={e => setFormData({ ...formData, assigned_to: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
