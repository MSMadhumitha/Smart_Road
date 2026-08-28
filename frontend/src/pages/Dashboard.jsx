import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { FileText, AlertTriangle, CheckCircle, BarChart3, TrendingUp, ShieldAlert, ArrowUpRight, Flame, Eye, XCircle, LayoutDashboard, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/admin/analytics');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        setError('Failed to load analytics dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <Loader message="Compiling analytics and trend data..." fullPage={true} />;
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
          <ShieldAlert className="text-rose-500 mx-auto mb-3" size={40} />
          <h3 className="text-lg font-bold text-slate-200">Access Error</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">{error || 'Unable to retrieve admin data.'}</p>
        </div>
      </div>
    );
  }

  const { summary, trend } = data;

  // Prepare data for Damage Type Chart
  const damageTypeData = Object.keys(summary.damageType || {}).map((key) => ({
    name: key,
    value: summary.damageType[key],
  }));

  const DAMAGE_COLORS = {
    Pothole: '#ef4444', // red
    Crack: '#f97316', // orange
    Other: '#0ea5e9', // sky
  };

  // Prepare data for Severity Chart
  const severityData = Object.keys(summary.severity || {}).map((key) => ({
    name: key,
    value: summary.severity[key],
  }));

  const SEVERITY_COLORS = {
    High: '#f43f5e', // rose
    Medium: '#f59e0b', // amber
    Low: '#64748b', // slate
  };

  // Safe fetch helper for counters
  const getStatusCount = (statusName) => summary.status?.[statusName] || 0;
  const getSeverityCount = (severityName) => summary.severity?.[severityName] || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="text-primary-400" />
            Admin Operations Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, damage distribution reports, and resolution logs.
          </p>
        </div>
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-semibold tracking-wide hover:border-slate-700 transition-all shrink-0"
        >
          <span>Open Report Manager</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {/* Total Filed */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Reports</span>
            <FileText size={16} />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{summary.totalReports}</h3>
        </div>

        {/* Pending */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
            <AlertTriangle size={16} />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{getStatusCount('Pending')}</h3>
        </div>

        {/* Inspected */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-violet-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inspected</span>
            <ClipboardCheck size={16} />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{getStatusCount('Inspected')}</h3>
        </div>

        {/* Under Review */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Review</span>
            <Eye size={16} />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{getStatusCount('In Review')}</h3>
        </div>

        {/* In Progress */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Progress</span>
            <TrendingUp size={16} />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{getStatusCount('In Progress')}</h3>
        </div>

        {/* Resolved */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resolved</span>
            <CheckCircle size={16} />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{getStatusCount('Resolved')}</h3>
        </div>

        {/* Rejected */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rejected</span>
            <XCircle size={16} />
          </div>
          <h3 className="text-2xl font-black text-slate-100">{getStatusCount('Rejected')}</h3>
        </div>
      </div>

      {/* Interactive Charts Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Area Chart (spans 2 columns) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-400" />
              14-Day Submission Trends
            </h3>
            <span className="text-[10px] bg-primary-500/10 border border-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Daily Count
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5c7599" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#5c7599" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} opacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontFamily: 'inherit',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#5c7599"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Priority Widget */}
        <div className="glass-panel rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Flame size={18} className="text-rose-400" />
              Severity Breakdown
            </h3>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
              Critical Check
            </span>
          </div>

          {severityData.length > 0 ? (
            <div className="h-60 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#5c7599'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-600 text-xs italic">
              No severity data collected yet.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Damage Type Distribution */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 flex flex-col justify-between lg:col-span-1">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-400" />
            Damage Classification
          </h3>

          {damageTypeData.length > 0 ? (
            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={damageTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {damageTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DAMAGE_COLORS[entry.name] || '#5c7599'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-600 text-xs italic">
              No damage type data.
            </div>
          )}
        </div>

        {/* High Priority Actions List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <AlertTriangle size={18} className="stroke-[2.5]" />
            Urgent Attention Areas
          </h3>
          <p className="text-xs text-slate-500">
            Below displays breakdown metrics of reports requiring immediate engineering intervention.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">High Severity Count</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-rose-400">{getSeverityCount('High')}</span>
                <span className="text-xs text-slate-600 font-medium">unresolved potholes or major defects</span>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">High Priority Count</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-rose-500">{summary.priority?.High || 0}</span>
                <span className="text-xs text-slate-600 font-medium">marked high risk for vehicles/pedestrians</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900 text-center">
            <Link
              to="/admin/reports?priority=High"
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors inline-flex items-center gap-1"
            >
              <span>Filter Report Manager by High Priority</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
