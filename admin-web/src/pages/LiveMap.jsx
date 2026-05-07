import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bike, Radio } from 'lucide-react';
import api from '../api/client';
import { getSocket } from '../api/socket';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';

// Override default icon paths (Leaflet quirk in bundlers).
const bikeIcon = L.divIcon({
  className: 'rider-marker',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;color:white;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🛵</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

export default function LiveMap() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const liveLocations = useRef({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/delivery');
      const seeded = data.partners
        .filter((p) => p.currentLocation?.coordinates?.length === 2 && p.currentLocation.coordinates[0] !== 0)
        .map((p) => ({
          partnerId: p.user?._id,
          name: p.user?.name,
          phone: p.user?.phone,
          vehicleNumber: p.vehicleNumber,
          isAvailable: p.isAvailable,
          isOnDuty: p.isOnDuty,
          lng: p.currentLocation.coordinates[0],
          lat: p.currentLocation.coordinates[1],
          activeOrder: p.activeOrder,
        }));
      setPartners(seeded);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = getSocket();
    const onLoc = ({ partnerId, lat, lng, name }) => {
      liveLocations.current[partnerId] = { lat, lng, at: Date.now() };
      setPartners((prev) => {
        const idx = prev.findIndex((p) => p.partnerId === partnerId);
        if (idx === -1) {
          return [...prev, { partnerId, name: name || 'Rider', lat, lng, isOnDuty: true }];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], lat, lng };
        return next;
      });
    };
    socket.on('partner:location', onLoc);
    return () => socket.off('partner:location', onLoc);
  }, []);

  const center = useMemo(() => {
    if (partners.length === 0) return [28.5355, 77.391];
    return [
      partners.reduce((s, p) => s + p.lat, 0) / partners.length,
      partners.reduce((s, p) => s + p.lng, 0) / partners.length,
    ];
  }, [partners]);

  return (
    <div className="p-8 h-screen flex flex-col">
      <PageHeader
        title="Live Map"
        subtitle="Real-time view of every on-duty delivery partner"
        actions={
          <span className="badge bg-green-100 text-green-700 flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse" /> Live
          </span>
        }
      />

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          <div className="card p-3 lg:col-span-1 overflow-y-auto">
            <h3 className="font-semibold text-slate-900 px-2 mb-3">On the road ({partners.length})</h3>
            <div className="space-y-2">
              {partners.map((p) => (
                <div key={p.partnerId} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center"><Bike size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.vehicleNumber || 'Bike'}</div>
                    </div>
                    {p.isAvailable ? (
                      <span className="badge bg-green-100 text-green-700 text-[10px]">Free</span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700 text-[10px]">Busy</span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    {p.lat?.toFixed(5)}, {p.lng?.toFixed(5)}
                  </div>
                </div>
              ))}
              {partners.length === 0 && (
                <p className="text-sm text-slate-500 px-2">No riders on duty.</p>
              )}
            </div>
          </div>

          <div className="card overflow-hidden lg:col-span-3 min-h-[500px]">
            <MapContainer center={center} zoom={13} className="w-full h-full">
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={partners} />
              {partners.map((p) => (
                <Marker key={p.partnerId} position={[p.lat, p.lng]} icon={bikeIcon}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-slate-500 text-xs">{p.phone}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        {p.isAvailable ? 'Available' : `Busy${p.activeOrder ? ' · on delivery' : ''}`}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
