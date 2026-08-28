import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Badge from './Badge';
import { AlertTriangle, Home, PlusCircle, LayoutDashboard, ClipboardList, LogOut, Menu, X, Shield, Bell, Check, Eye, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
    setShowNotifications(false);
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up polling interval (every 15 seconds) to check for new alerts
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      // Mark single notification as read if unread
      if (!notif.isRead) {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      }

      setShowNotifications(false);

      // Parse report ID from the message, e.g. "damage #12"
      const match = notif.message.match(/#(\d+)/);
      if (match && match[1]) {
        const reportId = match[1];
        if (user?.role === 'admin') {
          navigate(`/admin/reports/${reportId}`);
        } else {
          navigate(`/my-reports/${reportId}`);
        }
      } else {
        // Fallback redirection
        navigate(user?.role === 'admin' ? '/admin/dashboard' : '/my-reports');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
    }`;

  const mobileLinkClass = (path) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
    }`;

  return (
    <nav className="sticky top-0 z-[1000] w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 shadow-inner group-hover:border-primary-500/30 transition-all duration-300">
                {/* Glowing backdrop blur */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-amber-500/20 rounded-xl blur-sm opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                
                {/* SVG Custom Road-Warning Logo */}
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-5.5 h-5.5 relative z-10 transition-transform group-hover:scale-105 duration-300"
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Road Perspective grid lines */}
                  <path 
                    d="M12 4L6 20M12 4L18 20" 
                    stroke="url(#logo-road-grad)" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                  />
                  {/* Center lane dash */}
                  <path 
                    d="M12 6V18" 
                    stroke="#475569" 
                    strokeWidth="1.25" 
                    strokeDasharray="2 3" 
                    strokeLinecap="round" 
                    opacity="0.8"
                  />
                  {/* Neon Warning Triangle overlay */}
                  <path 
                    d="M12 7L5.5 17.5H18.5L12 7Z" 
                    fill="url(#logo-warning-bg)"
                    stroke="url(#logo-warning-stroke)" 
                    strokeWidth="1.5" 
                    strokeLinejoin="round"
                  />
                  {/* Exclamation point inside warning triangle */}
                  <path 
                    d="M12 10.5V13.5" 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="15.5" r="0.75" fill="#ffffff" />

                  {/* Gradients definitions */}
                  <defs>
                    <linearGradient id="logo-road-grad" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38bdf8" stopOpacity="0.2"/>
                      <stop offset="1" stopColor="#0ea5e9"/>
                    </linearGradient>
                    <linearGradient id="logo-warning-stroke" x1="12" y1="7" x2="12" y2="17.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#fbbf24"/>
                      <stop offset="1" stopColor="#f59e0b"/>
                    </linearGradient>
                    <linearGradient id="logo-warning-bg" x1="12" y1="7" x2="12" y2="17.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#fbbf24" stopOpacity="0.1"/>
                      <stop offset="1" stopColor="#f59e0b" stopOpacity="0.3"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex items-center leading-none">
                <span className="text-xl font-extrabold tracking-tight text-slate-100 transition-colors duration-300">
                  Smart<span className="text-primary-400">Road</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                {user.role === 'admin' ? (
                  <>
                    <Link to="/admin/dashboard" className={linkClass('/admin/dashboard')}>
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/reports" className={linkClass('/admin/reports')}>
                      <ClipboardList size={16} />
                      <span>Manage Reports</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/report/new" className={linkClass('/report/new')}>
                      <PlusCircle size={16} />
                      <span>Report Damage</span>
                    </Link>
                    <Link to="/my-reports" className={linkClass('/my-reports')}>
                      <ClipboardList size={16} />
                      <span>My Reports</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* User Section / Auth Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-800 text-slate-400 hover:text-primary-400 hover:bg-slate-900 transition-all duration-200"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative flex items-center justify-center h-10 w-10 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all duration-200"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-4 ring-slate-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl shadow-xl shadow-black/60 overflow-hidden border border-slate-800 flex flex-col z-[1100] animate-fade-in">
                      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Alerts Drawer</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                          >
                            <Check size={12} />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-900/60 scrollbar-thin">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-600 text-xs italic">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3.5 hover:bg-slate-900/40 cursor-pointer flex gap-3 text-left transition-all duration-150 ${
                                !notif.isRead ? 'bg-primary-500/[0.02] border-l-2 border-primary-500' : 'border-l-2 border-transparent'
                              }`}
                            >
                              <div className="flex-1 space-y-1">
                                <h4 className={`text-xs font-semibold ${!notif.isRead ? 'text-primary-300' : 'text-slate-300'}`}>
                                  {notif.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-slate-600 font-medium block pt-0.5">
                                  {new Date(notif.createdAt).toLocaleTimeString(undefined, {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {!notif.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0 mt-1.5 animate-pulse"></span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Widget */}
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-200">{user.name}</span>
                  <span className="flex items-center justify-end text-[10px] uppercase font-bold tracking-widest text-slate-500 space-x-0.5">
                    {user.role === 'admin' && <Shield size={10} className="text-primary-500 mr-0.5" />}
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all duration-200 shadow-md shadow-primary-600/10 hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-800 text-slate-400 hover:text-primary-400 hover:bg-slate-900 transition-all duration-200"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel animate-fade-in border-t-0 border-x-0 border-b border-slate-900">
          <div className="space-y-1.5 px-4 pt-3 pb-4">
            {user ? (
              <>
                <div className="px-4 py-3 border-b border-slate-900 mb-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-100">{user.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {user.role}
                    </span>
                  </div>
                  <Badge type="role" value={user.role} />
                </div>
                {user.role === 'admin' ? (
                  <>
                    <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass('/admin/dashboard')}>
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/reports" onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass('/admin/reports')}>
                      <ClipboardList size={18} />
                      <span>Manage Reports</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/report/new" onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass('/report/new')}>
                      <PlusCircle size={18} />
                      <span>Report Damage</span>
                    </Link>
                    <Link to="/my-reports" onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass('/my-reports')}>
                      <ClipboardList size={18} />
                      <span>My Reports</span>
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200 mt-4 border border-rose-500/10"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2.5 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-3 rounded-xl border border-slate-800 text-slate-300 hover:text-slate-100 font-medium text-base hover:bg-slate-900 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-base transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
