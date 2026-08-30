import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import MapView from '../components/MapView';
import { Calendar, MapPin, Clipboard, ArrowLeft, Clock, MessageSquare, AlertCircle, Sparkles, Settings, Trash2, Upload, X } from 'lucide-react';

const ReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing & Deleting state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [editNotes, setEditNotes] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const navigate = useNavigate();

  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/reports/${id}`);
        setReport(response.data);
        setEditNotes(response.data.userNotes || '');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load report details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleImageSelect = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...filesArray]);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setSaveLoading(true);

    try {
      const formData = new FormData();
      formData.append('userNotes', editNotes);
      selectedImages.forEach((img) => {
        formData.append('images', img);
      });

      const response = await api.patch(`/reports/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSaveSuccess('Report updated successfully!');
      setReport(response.data.report);
      setSelectedImages([]);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setSaveError(err.response?.data?.error || 'Failed to update report.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this report and all its evidence? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      await api.delete(`/reports/${id}`);
      navigate('/my-reports');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete report.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Fetching report details..." fullPage={true} />;
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
          <AlertCircle className="text-rose-500 mx-auto mb-3" size={40} />
          <h3 className="text-lg font-bold text-slate-200">Error Loading Details</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">{error || 'Report not found'}</p>
          <Link
            to="/my-reports"
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-semibold tracking-wide transition-all"
          >
            Back to My Reports
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
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/my-reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to My Reports</span>
        </Link>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setSaveError('');
              setSaveSuccess('');
            }}
            className={`px-3.5 py-1.5 border rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isEditing 
                ? 'bg-slate-900 border-primary-500/30 text-primary-400 hover:text-primary-300' 
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-primary-400 hover:border-primary-500/30'
            }`}
          >
            <Settings size={13} />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Report'}</span>
          </button>
          
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} />
            <span>{deleteLoading ? 'Deleting...' : 'Delete Report'}</span>
          </button>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Report ID: #{report.id}
          </span>
        </div>
      </div>

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metrics, Details, and History Timeline (7 cols) */}
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

          {/* AI Analysis Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 relative overflow-hidden">
            {/* Sparkle background element */}
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

          {/* User Notes & Admin Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes */}
            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clipboard size={14} />
                My Notes
              </h3>
              {isEditing ? (
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Update your notes about the hazard..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:ring-2 focus:ring-primary-500/50 resize-none"
                />
              ) : (
                <p className="text-sm text-slate-300 bg-slate-950/20 rounded-xl border border-slate-800/40 p-3.5 min-h-[80px]">
                  {report.userNotes || <span className="text-slate-600 italic">No notes provided.</span>}
                </p>
              )}
            </div>

            {/* Admin Remarks */}
            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} />
                Admin Remarks
              </h3>
              <p className="text-sm text-slate-300 bg-slate-950/20 rounded-xl border border-slate-800/40 p-3.5 min-h-[80px]">
                {report.adminRemarks || <span className="text-slate-600 italic">Awaiting review from city engineer.</span>}
              </p>
            </div>
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
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed bg-slate-950/20 border border-slate-900 rounded-lg p-2.5">
                      {item.remarks}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview & GPS Map (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Image display */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Visual Evidence</span>
              {isEditing && (
                <span className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">Edit Mode</span>
              )}
            </h3>

            {isEditing && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center hover:border-primary-500/30 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    id="edit-images-input"
                    className="hidden"
                  />
                  <label htmlFor="edit-images-input" className="cursor-pointer space-y-2 block">
                    <Upload className="mx-auto text-slate-500" size={24} />
                    <span className="text-xs font-semibold text-slate-300 block">Add Additional Images</span>
                    <span className="text-[10px] text-slate-500 block">Upload more evidence (max 5MB each)</span>
                  </label>
                </div>
                
                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">New Images to Upload ({selectedImages.length})</span>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImages.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {report.imageUrl && report.imageUrl.split(',').map((url, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                  <img
                    src={`${backendBase}${url}`}
                    alt={`Damage proof ${idx + 1}`}
                    className="w-full object-cover max-h-72 hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Location Map and Address details */}
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

      {isEditing && (
        <div className="mt-6 glass-panel rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-primary-500/20">
          <div className="text-xs text-slate-400">
            {saveError && <span className="text-rose-400 block mb-1 font-semibold">{saveError}</span>}
            {saveSuccess && <span className="text-emerald-400 block mb-1 font-semibold">{saveSuccess}</span>}
            <span>Update your citizen report description notes or attach more image evidence files.</span>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedImages([]);
                setEditNotes(report.userNotes || '');
                setSaveError('');
              }}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saveLoading}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-primary-500/10 disabled:opacity-30"
            >
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetails;
