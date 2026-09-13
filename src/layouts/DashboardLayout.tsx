import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Truck,
  Users,
  Route,
  Bell,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { NotificationItem, UserRole } from '../types.js';

export const DashboardLayout: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshingDocs, setRefreshingDocs] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleTriggerExpirationCheck = async () => {
    setRefreshingDocs(true);
    try {
      await api.post('/notifications/refresh');
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to refresh expirations', err);
    } finally {
      setRefreshingDocs(false);
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    try {
      setSwitchingRole(true);
      await demoLogin(role);
      navigate(role === 'driver' ? '/trips' : '/');
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on role
  const navItems = [
    ...(user?.role !== 'driver'
      ? [
          {
            label: 'Dashboard',
            path: '/',
            icon: LayoutDashboard,
          },
        ]
      : []),
    {
      label: user?.role === 'driver' ? 'Fleet Vehicles' : 'Vehicles',
      path: '/vehicles',
      icon: Truck,
    },
    ...(user?.role !== 'driver'
      ? [
          {
            label: 'Drivers',
            path: '/drivers',
            icon: Users,
          },
        ]
      : []),
    {
      label: user?.role === 'driver' ? 'My Assigned Trips' : 'Trips',
      path: '/trips',
      icon: Route,
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    ...(user?.role === 'admin'
      ? [
          {
            label: 'User Management',
            path: '/users',
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-lg tracking-tight">FAMAS</span>
          <span
            className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm border ml-1 ${
              user?.role === 'admin'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : user?.role === 'dispatcher'
                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                : 'bg-blue-950/80 text-blue-300 border-blue-800'
            }`}
          >
            {user?.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            id="mobile-signout-btn"
            title="Sign out of the system"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay on Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">
              FAMAS
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Fleet Admin & Mgmt</p>
          </div>
        </div>

        {/* Current User Role Pill */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Logged In As
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-white truncate max-w-[130px]">
              {user?.username}
            </span>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm border ${
                user?.role === 'admin'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : user?.role === 'dispatcher'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-blue-950/80 text-blue-300 border-blue-800'
              }`}
            >
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Defense / Evaluation Quick Switcher in Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Oral Defense Roles</span>
            <span className="text-[10px] text-blue-400 font-normal">1-Click</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['admin', 'dispatcher', 'driver'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleSwitch(r)}
                disabled={user?.role === r || switchingRole}
                className={`text-[11px] capitalize py-1.5 px-2 rounded-md font-medium border text-center transition-all ${
                  user?.role === r
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 cursor-default'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
                } ${switchingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {switchingRole && user?.role !== r ? '...' : r}
              </button>
            ))}
          </div>
        </div>

        {/* User Footer / Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 overflow-hidden mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
              {user?.username?.[0] || 'U'}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            id="sidebar-signout-btn"
            title="Sign out of the system"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-semibold transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out / Изход</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {location.pathname === '/'
                ? 'Operational Dashboard'
                : location.pathname.split('/')[1]?.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Run Expirations Scan Button */}
            <button
              onClick={handleTriggerExpirationCheck}
              disabled={refreshingDocs}
              title="Scan database for expiring inspection & insurance documents"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingDocs ? 'animate-spin text-blue-600' : ''}`} />
              <span>Check Expirations</span>
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.2 rounded-full font-medium">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((item) => (
                          <div
                            key={item._id}
                            className={`p-3.5 text-xs hover:bg-slate-50 transition-colors ${
                              !item.read ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {item.severity === 'critical' ? (
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              ) : item.severity === 'warning' ? (
                                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-slate-800 leading-snug">
                                  {item.title}
                                </p>
                                <p className="text-slate-600 mt-0.5 text-[11px]">{item.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(item.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View All Notifications &rarr;
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Demo Switcher on Header */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Role:
              </span>
              {(['admin', 'dispatcher', 'driver'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                    user?.role === r
                      ? 'bg-white text-blue-600 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Prominent Sign Out Button in Header - Always accessible for ALL roles */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200" id="header-user-actions">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.username}
                </span>
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-sm border inline-block ${
                    user?.role === 'admin'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : user?.role === 'dispatcher'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {user?.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                id="header-signout-btn"
                title="Sign out of the system"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
