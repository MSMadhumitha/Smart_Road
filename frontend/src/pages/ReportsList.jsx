import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import MapView from '../components/MapView';
import { Search, SlidersHorizontal, Map, Table, ChevronLeft, ChevronRight, Eye, Calendar, User, MapPin } from 'lucide-react';

const ReportsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter state
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & metrics
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Layout View mode
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'
  const [showFilters, setShowFilters] = useState(false);

  // Read params or set default
  const statusFilter = searchParams.get('status') || '';
  const severityFilter = searchParams.get('severity') || '';
  const priorityFilter = searchParams.get('priority') || '';
  const typeFilter = searchParams.get('damageType') || '';
  const searchFilter = searchParams.get('search') || '';
  const startFilter = searchParams.get('startDate') || '';
  const endFilter = searchParams.get('endDate') || '';

  // Fetch reports on filter change
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError('');
      try {
        const queryParams = new URLSearchParams({
          page,
          limit,
          status: statusFilter,
          severity: severityFilter,
          priority: priorityFilter,
          damageType: typeFilter,
          search: searchFilter,
          startDate: startFilter,
          endDate: endFilter,
        });

        const response = await api.get(`/admin/reports?${queryParams.toString()}`);
        setReports(response.data.reports);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.total);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch reports list. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [page, statusFilter, severityFilter, priorityFilter, typeFilter, searchFilter, startFilter, endFilter]);

  // Handle parameter changes
  const updateFilterParam = (key, value) => {
    setPage(1); // Reset page on filter edit
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setPage(1);
  };

  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

  const getPriorityRowClass = (priority) => {
    switch (String(priority).toLowerCase()) {
      case 'high':
        return 'bg-rose-500/[0.03] hover:bg-rose-500/[0.06] border-l-2 border-l-rose-500';
      case 'medium':
        return 'bg-amber-500/[0.01] hover:bg-amber-500/[0.04] border-l-2 border-l-amber-500';
      default:
        return 'hover:bg-slate-900/40 border-l-2 border-l-transparent';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Road Damage Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review alerts, prioritize road maintenance, and coordinate city repairs.
          </p>
        </div>

        {/* Layout switch */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-900 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-slate-900 text-primary-400 border border-slate-800/80 shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Table View"
          >
            <Table size={16} />
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

      {/* Filter toolbar */}
      <div className="glass-panel rounded-2xl p-5 mb-6 space-y-4">
        {/* Quick Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => updateFilterParam('search', e.target.value)}
              placeholder="Search by address, user notes, or AI descriptions..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-xs"
            />
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                showFilters || statusFilter || severityFilter || priorityFilter || typeFilter || startFilter || endFilter
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {(statusFilter || severityFilter || priorityFilter || typeFilter || startFilter || endFilter) && (
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
              )}
            </button>

            {(statusFilter || severityFilter || priorityFilter || typeFilter || searchFilter || startFilter || endFilter) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Collapsible advanced filters drawer */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-800/55 animate-fade-in">
            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => updateFilterParam('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Inspected">Inspected</option>
                <option value="In Review">In Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => updateFilterParam('severity', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => updateFilterParam('priority', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Damage type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Damage Type</label>
              <select
                value={typeFilter}
                onChange={(e) => updateFilterParam('damageType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                <option value="Pothole">Pothole</option>
                <option value="Crack">Crack</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date range inputs */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Report Start Date</label>
              <input
                type="date"
                value={startFilter}
                onChange={(e) => updateFilterParam('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Report End Date</label>
              <input
                type="date"
                value={endFilter}
                onChange={(e) => updateFilterParam('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main content display */}
      {loading ? (
        <Loader message="Fetching filtered reports list..." />
      ) : error ? (
        <div className="text-center p-8 glass-panel rounded-2xl text-rose-400">
          <p>{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl">
          <h3 className="text-slate-300 font-bold">No Records Found</h3>
          <p className="text-slate-500 text-xs mt-1">
            No road damage reports matched the current filter conditions.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table Layout */
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-900 shadow-xl bg-slate-950/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950/60">
                  <th className="py-4 px-5">ID</th>
                  <th className="py-4 px-4">Preview</th>
                  <th className="py-4 px-4">Citizen</th>
                  <th className="py-4 px-4">Address</th>
                  <th className="py-4 px-4">Damage Type</th>
                  <th className="py-4 px-4">Severity</th>
                  <th className="py-4 px-4">Priority</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className={`transition-colors duration-150 ${getPriorityRowClass(report.priority)}`}
                  >
                    {/* ID */}
                    <td className="py-4 px-5 font-bold text-slate-300">#{report.id}</td>

                    {/* Image Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="h-11 w-11 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                        <img
                          src={
                            report.imageUrl
                              ? (() => {
                                  const first = report.imageUrl.split(/,(?=data:|https?:|\/uploads|uploads)/)[0];
                                  return first.startsWith('data:') || first.startsWith('http')
                                    ? first
                                    : `${backendBase}${first}`;
                                })()
                              : ''
                          }
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Citizen Info */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 flex items-center gap-1">
                          <User size={12} className="text-slate-500" />
                          {report.user?.name || 'Citizen'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{report.user?.email}</span>
                      </div>
                    </td>

                    {/* Address Location */}
                    <td className="py-4 px-4 max-w-[200px]">
                      <div className="flex items-start gap-1">
                        <MapPin size={12} className="text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-slate-300 leading-relaxed">
                          {report.address || 'Address unresolved'}
                        </span>
                      </div>
                    </td>

                    {/* Damage Type */}
                    <td className="py-4 px-4">
                      <Badge type="damage_type" value={report.damageType} />
                    </td>

                    {/* Severity */}
                    <td className="py-4 px-4">
                      <Badge type="severity" value={report.severity} />
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4">
                      <Badge type="priority" value={report.priority} />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <Badge type="status" value={report.status} />
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-4 text-center">
                      <Link
                        to={`/admin/reports/${report.id}`}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
                          report.status === 'Pending'
                            ? 'bg-primary-950/20 border-primary-500/30 text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 hover:border-primary-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <Eye size={12} />
                        <span>{report.status === 'Pending' ? 'Inspect' : 'View'}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-1 bg-transparent border-t border-transparent pt-4">
            <span className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-400">{reports.length}</span> of{' '}
              <span className="font-semibold text-slate-400">{totalCount}</span> reports
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-400 font-semibold px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Map Layout */
        <div className="rounded-2xl overflow-hidden border border-slate-900 shadow-xl overflow-hidden h-[600px]">
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

export default ReportsList;
