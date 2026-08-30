import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import MapView from '../components/MapView';
import { Calendar, MapPin, Clipboard, ArrowLeft, Clock, MessageSquare, AlertCircle, Sparkles, User, Mail, Phone, Settings, CheckCircle } from 'lucide-react';

const AdminReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Form state
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

  const fetchDetails = async () => {
    try {
      const response = await api.get(`/admin/reports/${id}`);
      let reportData = response.data;

      if (reportData.status === 'Pending') {
        try {
          await api.patch(`/admin/reports/${id}/status`, {
            status: 'Inspected',
            remarks: 'Report opened and inspected by administrator.',
          });
          // Re-fetch complete report details with updated status and history log
          const refreshedResponse = await api.get(`/admin/reports/${id}`);
          reportData = refreshedResponse.data;
        } catch (updateErr) {
          console.error('Failed to auto-update report status to Inspected:', updateErr);
        }
      }

      setReport(reportData);
      setStatus(reportData.status);
      setRemarks(reportData.adminRemarks || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load report details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDetails();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setUpdateLoading(true);

    try {
      await api.patch(`/admin/reports/${id}/status`, {
        status,
        remarks,
      });

      setUpdateSuccess('Report status updated successfully!');
      // Re-fetch report details to refresh history logs
      await fetchDetails();
    } catch (err) {
      setUpdateError(err.response?.data?.error || 'Failed to update report status.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Fetching complete report metadata..." fullPage={true} />;
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
          <AlertCircle className="text-rose-500 mx-auto mb-3" size={40} />
          <h3 className="text-lg font-bold text-slate-200">Error Loading Details</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">{error || 'Report not found'}</p>
          <Link
            to="/admin/reports"
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-semibold tracking-wide transition-all"
          >
            Back to Report Manager
          </Link>
        </div>
      </div>
    );
  }

  const lat = parseFloat(report.latitude);
  const lng = parseFloat(report.longitude);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Navigation header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Report Manager</span>
        </Link>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Inspection Report ID: #{report.id}
        </span>
      </div>

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metrics, Details, Citizen card, and History Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Title & Badges */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold block mb-0.5">DAMAGE CLASSIFICATION</span>
                <h1 className="text-2xl font-black text-slate-100">{report.damageType}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge type="status" value={report.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity</span>
                <div className="mt-1"><Badge type="severity" value={report.severity} /></div>
              </div>
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</span>
                <div className="mt-1"><Badge type="priority" value={report.priority} /></div>
              </div>
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl col-span-2 sm:col-span-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reported On</span>
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mt-1.5">
                  <Calendar size={12} className="text-slate-500" />
                  {new Date(report.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Citizen Reporter Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-3">
              <User size={14} className="text-primary-400" />
              Citizen Reporter Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block">Name</span>
                <span className="font-semibold text-slate-200">{report.user?.name || 'Unknown'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block flex items-center gap-1">
                  <Mail size={12} /> Email
                </span>
                <span className="font-semibold text-slate-200">{report.user?.email || 'N/A'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block flex items-center gap-1">
                  <Phone size={12} /> Phone
                </span>
                <span className="font-semibold text-slate-200">{report.user?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* AI Analysis Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Sparkles size={16} className="text-primary-400" />
              Gemini Vision AI Analysis
            </h3>
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "{report.aiDescription || 'AI failed to analyze.'}"
              </p>
              {report.confidence !== null && (
                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-900 pt-2.5">
                  <span>Confidence Index:</span>
                  <span className="font-semibold text-slate-300">{(report.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* User Notes */}
          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clipboard size={14} />
              Citizen Submitted Notes
            </h3>
            <p className="text-sm text-slate-300 bg-slate-950/20 rounded-xl border border-slate-800/40 p-3.5 min-h-[80px]">
              {report.userNotes || <span className="text-slate-600 italic">No notes provided.</span>}
            </p>
          </div>

          {/* Status Timeline History */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Clock size={16} className="text-primary-400" />
              Resolution Log & Timeline
            </h3>

            <div className="relative border-l border-slate-800 ml-3.5 pl-6 space-y-6 pt-2">
              {report.statusHistory.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Timeline indicator circle */}
                  <div className="absolute -left-[31px] mt-1.5 flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary-500 ring-4 ring-slate-950"></div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">
                        {item.newStatus}
                      </span>
                      {item.oldStatus && (
                        <span className="text-[10px] text-slate-500">
                          (from {item.oldStatus})
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 ml-auto shrink-0">
                        {new Date(item.changedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {item.remarks && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed bg-slate-950/20 border border-slate-900 rounded-lg p-2.5">
                        {item.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview, Map, & Status Update Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Control Panel */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 border border-primary-500/20">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Settings size={16} className="text-primary-400" />
              Administrative Controls
            </h3>

            {updateError && (
              <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            {updateSuccess && (
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs">
                <CheckCircle size={14} className="shrink-0" />
                <span>{updateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Update Report Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="Pending">Pending</option>
                  <option value="Inspected">Inspected</option>
                  <option value="In Review">In Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks / Logs</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Input detailed status change notes or admin engineering feedback remarks..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:ring-2 focus:ring-primary-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={updateLoading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-primary-500/10"
              >
                {updateLoading ? 'Saving...' : 'Update Status & Log'}
              </button>
            </form>
          </div>

          {/* Visual evidence */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Visual Evidence</h3>
            <div className="space-y-3">
              {report.imageUrl && report.imageUrl.split(',').map((url, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
                  <img
                    src={`${backendBase}${url}`}
                    alt={`Damage proof ${idx + 1}`}
                    className="w-full object-cover max-h-72 hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Location Map and Address */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-500" />
              GeoLocation Reference
            </h3>

            <div className="h-60 rounded-xl overflow-hidden border border-slate-800">
              <MapView mode="single" center={[lat, lng]} zoom={15} height="100%" />
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-0.5">Identified Address:</span>
                {report.address || 'Address not resolved.'}
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-2 flex justify-between">
                <span>Lat: {lat.toFixed(6)}</span>
                <span>Lng: {lng.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportDetails;
