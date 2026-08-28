import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import MapView from '../components/MapView';
import { Grid, Map, FileText, Calendar, MapPin, ChevronRight, CheckCircle2, Clock, Eye } from 'lucide-react';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [error, setError] = useState('');

  // Fetch citizen reports
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError('');
      try {
        const url = statusFilter ? `/reports/my?status=${statusFilter}` : '/reports/my';
        const response = await api.get(url);
        setReports(response.data);
      } catch (err) {
        setError('Failed to fetch reports. Please refresh the page.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [statusFilter]);

  // Compute metric summaries
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  const backendBase = 'http://localhost:5000'; // Fallback backend base URL

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">My Damage Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track and monitor the resolution progress of your submitted road reports.
          </p>
        </div>
        <Link
          to="/report/new"
          className="inline-flex items-center justify-center px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:scale-[1.02] text-sm shrink-0"
        >
          Submit New Report
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-primary-400">
            <FileText size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Filed</span>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-0.5">{totalCount}</h3>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-amber-400">
            <Clock size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Awaiting Review</span>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-0.5">{pendingCount}</h3>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Resolved</span>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-0.5">{resolvedCount}</h3>
          </div>
        </div>

      </div>

      {/* Filter and View Toggle Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-900 pb-5">
        {/* Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {[
            { label: 'All', value: '' },
            { label: 'Pending', value: 'Pending' },
            { label: 'In Review', value: 'In Review' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Resolved', value: 'Resolved' },
            { label: 'Rejected', value: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all shrink-0 ${
                statusFilter === tab.value
                  ? 'bg-primary-500/10 text-primary-400 border-primary-500/30'
                  : 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-900 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-primary-400 border border-slate-800/80 shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Grid View"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'map'
                ? 'bg-slate-900 text-primary-400 border border-slate-800/80 shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Map View"
          >
            <Map size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loader message="Loading your reports..." />
      ) : error ? (
        <div className="text-center p-8 glass-panel rounded-2xl">
          <p className="text-rose-400">{error}</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl flex flex-col items-center justify-center">
          <FileText size={48} className="text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No Reports Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {statusFilter
              ? `You don't have any reports currently matching the "${statusFilter}" status.`
              : "You haven't submitted any damage reports yet. Get started by reporting your first hazard."}
          </p>
          {!statusFilter && (
            <Link
              to="/report/new"
              className="mt-5 px-4 py-2 text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all"
            >
              Report Road Damage
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="glass-panel glass-card rounded-2xl overflow-hidden flex flex-col group"
            >
              {/* Image Preview */}
              <div className="relative h-48 overflow-hidden bg-slate-950">
                <img
                  src={`${backendBase}${report.imageUrl ? report.imageUrl.split(',')[0] : ''}`}
                  alt={report.damageType}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Badge type="status" value={report.status} />
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  <Badge type="damage_type" value={report.damageType} />
                  <Badge type="severity" value={report.severity} />
                </div>
              </div>

              {/* Text Details */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(report.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="font-bold">ID: #{report.id}</span>
                </div>

                <p className="text-slate-300 text-sm line-clamp-2 mb-4 italic flex-1">
                  "{report.aiDescription || 'Processing image analysis...'}"
                </p>

                <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-4 border-t border-slate-800/60 pt-3">
                  <MapPin size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{report.address || 'Address unavailable'}</span>
                </div>

                <Link
                  to={`/my-reports/${report.id}`}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 bg-slate-950 border border-slate-800 hover:border-primary-500/30 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-semibold tracking-wide transition-all"
                >
                  <Eye size={14} />
                  <span>View Details</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Map Layout */
        <div className="rounded-2xl overflow-hidden border border-slate-900 shadow-xl overflow-hidden h-[500px]">
          <MapView
            mode="multiple"
            center={
              reports.length > 0
                ? [parseFloat(reports[0].latitude), parseFloat(reports[0].longitude)]
                : [20.5937, 78.9629]
            }
            reports={reports}
            zoom={12}
            height="100%"
          />
        </div>
      )}
    </div>
  );
};

export default MyReports;
