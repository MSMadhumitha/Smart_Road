import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Import leaflet CSS and fix default marker asset resolving in React/Vite
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Delete the default _getIconUrl property to force using our overrides
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// A component that shifts the map center when coordinates update
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Component to handle map clicks for coordinate selection
const LocationMarkerSelector = ({ setLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLocation([lat, lng]);
    },
  });
  return null;
};

/**
 * Reusable Leaflet map component
 * @param {string} mode - 'select' (for coordinate picking), 'single' (display one pin), 'multiple' (display many pins)
 * @param {array} center - [lat, lng] to center the map
 * @param {number} zoom - initial zoom level
 * @param {array} reports - list of reports for 'multiple' mode
 * @param {array} location - selected coordinate for 'select' mode [lat, lng]
 * @param {function} setLocation - callback to set coordinate in 'select' mode
 */
const MapView = ({
  mode = 'single',
  center = [20.5937, 78.9629], // Default to center of India if none specified
  zoom = 13,
  reports = [],
  location = null,
  setLocation = () => {},
  height = '400px',
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  // Safe center fallback
  const validCenter = center && center[0] && center[1] ? center : [20.5937, 78.9629];

  return (
    <div style={{ height, width: '100%' }} className="relative z-10">
      <MapContainer
        center={validCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={theme}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={mode === 'select' && location ? location : validCenter} />

        {/* 1. SELECTION MODE: Citizen pins damage on map */}
        {mode === 'select' && (
          <>
            <LocationMarkerSelector setLocation={setLocation} />
            {location && (
              <Marker
                position={location}
                draggable={true}
                eventHandlers={{
                  dragend(e) {
                    const marker = e.target;
                    if (marker != null) {
                      const { lat, lng } = marker.getLatLng();
                      setLocation([lat, lng]);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-slate-900 text-xs font-semibold">
                    Selected Road Damage Location
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}

        {/* 2. SINGLE PIN MODE: Details page map */}
        {mode === 'single' && validCenter && (
          <Marker position={validCenter}>
            <Popup>
              <div className="text-slate-900 text-xs font-semibold">
                Damage Reported Here
              </div>
            </Popup>
          </Marker>
        )}

        {/* 3. MULTIPLE PINS MODE: Citizen List / Admin Map view */}
        {mode === 'multiple' &&
          reports.map((report) => {
            const lat = parseFloat(report.latitude);
            const lng = parseFloat(report.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const detailLink = user?.role === 'admin'
              ? `/admin/reports/${report.id}`
              : `/my-reports/${report.id}`;

            return (
              <Marker key={report.id} position={[lat, lng]}>
                <Popup>
                  <div className="p-1 font-sans text-slate-100 bg-slate-950/20 max-w-[200px]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400">#{report.id}</span>
                      <Badge type="status" value={report.status} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">
                      {report.damageType} ({report.severity})
                    </h4>
                    <p className="text-[10px] text-slate-600 line-clamp-2 mb-2">
                      {report.address || 'Address unavailable'}
                    </p>
                    <Link
                      to={detailLink}
                      className="block text-center text-[10px] font-bold bg-primary-600 hover:bg-primary-500 text-white py-1 rounded transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

export default MapView;
