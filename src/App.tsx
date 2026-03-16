import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Activity,
  Dog,
  Heart,
  DollarSign,
  TrendingUp,
  FileText,
  LogOut,
  Menu,
  AlertCircle,
  Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import Dashboard from './pages/Dashboard';
import AnimalList from './pages/AnimalList';
import AnimalDetail from './pages/AnimalDetail';
import AnimalRegistration from './pages/AnimalRegistration';
import BreedingManagement from './pages/BreedingManagement';
import HealthManagement from './pages/HealthManagement';
import FeedManagement from './pages/FeedManagement';
import Financials from './pages/Financials';
import InvestorPortal from './pages/InvestorPortal';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Tasks from './pages/Tasks';
import Login from './pages/Login';

// Auth Context / State
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData: any, token: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, login, logout, loading };
};

const AuthContext = React.createContext<any>(null);

// Error boundary for catching fetch/network failures
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (this as any).state as { hasError: boolean } | null;
    if (s?.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#F8F9FA] gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
          <p className="text-gray-500 text-sm text-center max-w-sm">
            A component crashed unexpectedly. This may be caused by the backend server not running.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
          >
            Retry
          </button>
        </div>
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).props.children as React.ReactNode;
  }
}

export default function App() {
  const auth = useAuth();

  if (auth.loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <AuthContext.Provider value={auth}>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={!auth.user ? <Login /> : <Navigate to="/" />} />
            <Route path="/*" element={auth.user ? <Layout /> : <Navigate to="/login" />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthContext.Provider>
  );
}

// Offline / server-down banner
function ServerStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        setOffline(!res.ok && res.status !== 401 && res.status !== 403);
      } catch {
        setOffline(true);
      }
    };
    check();
  }, []);

  if (!offline) return null;
  return (
    <div className="bg-red-500 text-white text-sm font-medium px-8 py-2 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" />
      Cannot connect to the server. Make sure the backend is running (<code className="font-mono">npm run dev</code>).
    </div>
  );
}

function Layout() {
  const { user, logout } = React.useContext(AuthContext);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Farm Manager', 'Veterinary Officer', 'Farm Staff', 'Investor'] },
    { name: 'Livestock', path: '/animals', icon: Dog, roles: ['Admin', 'Farm Manager', 'Veterinary Officer', 'Farm Staff', 'Investor'] },
    { name: 'Breeding', path: '/breeding', icon: Heart, roles: ['Admin', 'Farm Manager', 'Veterinary Officer'] },
    { name: 'Health', path: '/health', icon: Activity, roles: ['Admin', 'Farm Manager', 'Veterinary Officer', 'Farm Staff'] },
    { name: 'Feed', path: '/feed', icon: ClipboardList, roles: ['Admin', 'Farm Manager', 'Farm Staff'] },
    { name: 'Financials', path: '/financials', icon: DollarSign, roles: ['Admin', 'Farm Manager'] },
    { name: 'Investor Portal', path: '/investor', icon: TrendingUp, roles: ['Investor', 'Admin'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['Admin', 'Farm Manager'] },
    { name: 'Tasks', path: '/tasks', icon: ClipboardList, roles: ['Admin', 'Farm Manager', 'Veterinary Officer', 'Farm Staff'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['Admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  // Format the page title from the URL path — replace all hyphens, handle nested paths
  const rawSegment = location.pathname === '/' ? 'Overview' : location.pathname.split('/').filter(Boolean)[0];
  const pageTitle = rawSegment.replace(/-/g, ' ');

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#151619] text-white transition-all duration-300 flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">AgriFlow</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={item.name}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group hover:scale-105 active:scale-95 cursor-pointer",
                location.pathname === item.path
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            title="Logout"
            className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ServerStatusBanner />
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold capitalize">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/animals" element={<AnimalList />} />
            <Route path="/animals/new" element={<AnimalRegistration />} />
            <Route path="/animals/:id" element={<AnimalDetail />} />
            <Route path="/breeding" element={<BreedingManagement />} />
            <Route path="/health" element={<HealthManagement />} />
            <Route path="/feed" element={<FeedManagement />} />
            <Route path="/financials" element={<Financials />} />
            <Route path="/investor" element={<InvestorPortal />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export { AuthContext };

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=15', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch { /* silent */ }
  };

  // Refetch on open; count badge persists until marked read
  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  // Initialise badge on mount
  React.useEffect(() => {
    fetch('/api/notifications?limit=5', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.ok ? r.json() : []).then(d => setUnread(d.length > 0 ? Math.min(d.length, 9) : 0)).catch(() => { });
  }, []);

  const actionIcons: Record<string, string> = {
    'Create Animal': '🐄',
    'Update Animal': '✏️',
    'Record Weight': '⚖️',
    'Report Health Incident': '🏥',
    'Record Mating': '💞',
    'Record Transaction': '💰',
    'Approve User': '✅',
    'Reject User': '❌',
    'Schedule Vaccination': '💉',
    'Update Vaccination': '💉',
    'Create Task': '📋',
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 hover:bg-gray-100 rounded-xl transition-all hover:scale-110 active:scale-90 cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Recent Activity</h3>
              <button
                onClick={() => { setUnread(0); setOpen(false); }}
                className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400 italic">No activity yet</div>
              ) : (
                notifications.map((n: any) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{actionIcons[n.action] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{n.action}</p>
                        <p className="text-[11px] text-gray-500 truncate">{n.details}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {n.actor_name || 'System'} · {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
