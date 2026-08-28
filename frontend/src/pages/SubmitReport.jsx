import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import api from '../services/api';
import { Camera, MapPin, FileText, UploadCloud, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const SubmitReport = () => {
  const navigate = useNavigate();

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [location, setLocation] = useState(null); // [lat, lng]
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Location selector options states
  const [locationSource, setLocationSource] = useState('gps'); // 'gps' | 'map' | 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  // 1. Fetch current GPS location on mount
  useEffect(() => {
    fetchGPS();
  }, []);

  const updateLocationAndAddress = async (lat, lng, source) => {
    setLocation([lat, lng]);
    setLocationSource(source);
    
    // Trigger reverse geocoding
    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SmartRoadDamageReporter/1.0',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAddress(data.display_name || 'Location selected');
      } else {
        setAddress('Location selected');
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
      setAddress('Location selected');
    } finally {
      setAddressLoading(false);
    }
  };

  const fetchGPS = () => {
    if (!navigator.geolocation) {
      setGpsError(true);
      setError('Geolocation is not supported by your browser. Please drop a pin on the map.');
      setLocationSource('map');
      return;
    }

    setGpsLoading(true);
    setGpsError(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocationAndAddress(latitude, longitude, 'gps');
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsLoading(false);
        setGpsError(true);
        setLocationSource('map');
        setError('Location access denied. Please click on the map to manually select the damage location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'User-Agent': 'SmartRoadDamageReporter/1.0',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        if (data.length === 0) {
          setSearchError('No locations found. Try a different query.');
        }
      } else {
        setSearchError('Failed to fetch search results.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Error searching for location.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      setLocation([lat, lon]);
      setAddress(result.display_name || '');
      setLocationSource('search');
      setSearchResults([]);
    }
  };

  // 2. Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Maximum size allowed is 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Invalid file type. Please select an image file (jpg, png, webp).');
      return;
    }

    setError('');
    setImage(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 3. Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!image) {
      setError('Please upload a photo of the road damage.');
      return;
    }

    if (!location || !location[0] || !location[1]) {
      setError('Please select a location on the map or allow location access.');
      return;
    }

    setLoading(true);

    // Construct multipart form data
    const formData = new FormData();
    formData.append('image', image);
    formData.append('latitude', location[0]);
    formData.append('longitude', location[1]);
    formData.append('user_notes', notes);
    if (address) {
      formData.append('address', address);
    }

    try {
      await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Report submitted successfully! Analyzing report...');
      setTimeout(() => {
        navigate('/my-reports');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-100">Report Road Damage</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload a photo, pinpoint the location, and help city administration fix our roads.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm">
          <CheckCircle size={20} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form details */}
        <div className="space-y-6">
          {/* Image Upload Area */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Camera size={18} className="text-primary-400" />
              1. Upload Damage Photo
            </h2>

            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-primary-500/40 rounded-xl cursor-pointer p-10 group bg-slate-950/40 transition-all duration-300">
                <UploadCloud size={40} className="text-slate-500 group-hover:text-primary-400 transition-colors" />
                <span className="mt-4 text-sm font-semibold text-slate-300">Click to upload or take a photo</span>
                <span className="mt-1 text-xs text-slate-500">Supports JPG, PNG, WEBP (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/50">
                <img
                  src={imagePreview}
                  alt="Road damage preview"
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview('');
                  }}
                  className="absolute top-3 right-3 px-3 py-1.5 text-xs font-semibold bg-slate-950/80 hover:bg-rose-950 border border-slate-800 hover:border-rose-500/30 text-rose-400 rounded-lg backdrop-blur-sm transition-all"
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>

          {/* User Notes */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <FileText size={18} className="text-primary-400" />
              2. Additional Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide any additional details (e.g. depth of pothole, road name/landmarks, how long it has been there...)"
              rows={4}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm resize-none"
            />
          </div>
        </div>

        {/* Right Column: Location Map picker */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <MapPin size={18} className="text-primary-400" />
              3. Identify Location
            </h2>
          </div>

          {/* Location Mode Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setLocationSource('gps');
                fetchGPS();
              }}
              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center ${
                locationSource === 'gps'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Current GPS
            </button>
            <button
              type="button"
              onClick={() => setLocationSource('map')}
              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center ${
                locationSource === 'map'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Select on Map
            </button>
            <button
              type="button"
              onClick={() => setLocationSource('search')}
              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center ${
                locationSource === 'search'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Search Address
            </button>
          </div>

          {/* Location Mode helper messages & fields */}
          {locationSource === 'gps' && (
            <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] text-slate-400">
                {gpsLoading ? 'Acquiring GPS location...' : 'Current GPS location active.'}
              </span>
              <button
                type="button"
                onClick={fetchGPS}
                disabled={gpsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-lg hover:border-slate-700 disabled:opacity-50 transition-all"
              >
                <RefreshCw size={12} className={gpsLoading ? 'animate-spin' : ''} />
                {gpsLoading ? 'Locating...' : 'Refresh GPS'}
              </button>
            </div>
          )}

          {locationSource === 'map' && (
            <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-[11px] text-slate-400">
              Click anywhere on the map or drag the marker to select the exact damage location manually.
            </div>
          )}

          {locationSource === 'search' && (
            <div className="space-y-2 relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Enter landmark, address, street name..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors shrink-0"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchError && (
                <div className="text-[11px] text-rose-400 flex items-center gap-1.5 px-1">
                  <AlertCircle size={12} />
                  <span>{searchError}</span>
                </div>
              )}

              {searchResults.length > 0 && (
                <ul className="absolute top-[105%] left-0 right-0 max-h-48 overflow-y-auto border border-slate-800 bg-slate-950 rounded-lg divide-y divide-slate-900 z-50 shadow-2xl">
                  {searchResults.map((result) => (
                    <li key={result.place_id}>
                      <button
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full px-3 py-2.5 text-left text-[11px] text-slate-300 hover:text-white hover:bg-slate-900 transition-colors line-clamp-2"
                      >
                        {result.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Leaflet Map display */}
          <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950/20">
            {gpsLoading ? (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400 mt-2 font-medium">Acquiring GPS Signal...</span>
              </div>
            ) : null}

            <MapView
              mode="select"
              center={location || [20.5937, 78.9629]}
              location={location}
              setLocation={(newLoc) => {
                if (newLoc) {
                  updateLocationAndAddress(newLoc[0], newLoc[1], 'map');
                }
              }}
              zoom={location ? 16 : 4}
              height="100%"
            />
          </div>

          {/* Detailed Selected Location Display */}
          {location ? (
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="text-emerald-500 shrink-0" size={16} />
                  <span className="font-semibold text-slate-200 text-xs">Coordinates Locked</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700 capitalize">
                  {locationSource === 'gps' ? 'GPS Signal' : locationSource === 'map' ? 'Map Pin' : 'Searched Address'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-900">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Latitude</span>
                  <span className="font-mono text-slate-300">{location[0].toFixed(7)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Longitude</span>
                  <span className="font-mono text-slate-300">{location[1].toFixed(7)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold mb-1">Address / Location Name</span>
                {addressLoading ? (
                  <div className="flex items-center gap-1.5 text-slate-500 italic py-1">
                    <RefreshCw size={12} className="animate-spin text-primary-500" />
                    Retrieving address details...
                  </div>
                ) : (
                  <span className="text-slate-300 block line-clamp-2 leading-relaxed min-h-[1.5rem]">
                    {address || 'No address details available'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>Please select a location using GPS, map clicking, or address search.</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.98] transition-all text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading & Processing AI Vision Analysis...</span>
                </div>
              ) : (
                'Submit Road Report'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitReport;
