import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import polyline from '@mapbox/polyline'
import 'leaflet/dist/leaflet.css'
import { LogOut, MapPin, Navigation, Zap, ShieldCheck, Scale, Search, Clock, CheckCircle2, Footprints, Train, Bus, Car, Wallet } from 'lucide-react'
import type { AuthUser, RouteMode } from '../api'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api'

interface DashboardProps {
  user: AuthUser
  onLogout: () => void
}

// --- Google Maps Loader ---
function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) { resolve(); return; }
    if (document.querySelector('script[data-gm]')) {
      const t = setInterval(() => { if ((window as any).google?.maps?.places) { clearInterval(t); resolve(); } }, 100);
      return;
    }
    const s = document.createElement('script');
    s.setAttribute('data-gm', '1');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(s);
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`);
    const d = await r.json();
    if (d.status === 'OK' && d.results.length > 0) {
      for (const res of d.results) {
        if ((res.types || []).some((t: string) => ['locality', 'sublocality', 'neighborhood'].includes(t))) {
          return res.formatted_address;
        }
      }
      return d.results[0].formatted_address;
    }
  } catch (e) { console.error('reverseGeocode error', e); }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// --- Map Helpers ---
function FitBounds({ paths }: { paths: [number, number][][] }) {
  const map = useMap();
  useEffect(() => {
    const pts = paths.flat();
    if (pts.length > 0) map.fitBounds(L.latLngBounds(pts), { padding: [60, 60] });
  }, [paths]);
  return null;
}

function MapClickHandler({ pinMode, onPin }: { pinMode: 'origin' | 'destination' | null; onPin: (lat: number, lng: number, label: string) => void }) {
  const [busy, setBusy] = useState(false);
  useMapEvents({
    async click(e) {
      if (!pinMode || busy) return;
      setBusy(true);
      const label = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      onPin(e.latlng.lat, e.latlng.lng, label);
      setBusy(false);
    },
  });
  return null;
}

// --- Icons & Labels ---
const getLegColor = (type: string, idx: number) => {
  const LEG_COLORS = ['#0EA5E9', '#F97316', '#10B981', '#8B5CF6'];
  return type === 'WALKING' ? '#CBD5E1' : LEG_COLORS[idx % LEG_COLORS.length];
};

const getVehicleIcon = (type: string, vehicle = '') => {
  if (type === 'WALKING') return <Footprints size={18} />;
  const v = vehicle.toUpperCase();
  if (v.includes('RAIL') || v.includes('TRAIN')) return <Train size={18} />;
  if (v.includes('BUS')) return <Bus size={18} />;
  return <Car size={18} />;
};

const fmtMins = (mins: number) => {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
};

// --- Main Dashboard ---
export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [pinMode, setPinMode] = useState<'origin' | 'destination' | null>(null)
  
  const [routeMode, setRouteMode] = useState<RouteMode>('balanced')
  const [routes, setRoutes] = useState<any[]>([])
  const [selIdx, setSelIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ailaTip, setAilaTip] = useState('')

  const originRef = useRef<HTMLInputElement>(null)
  const destRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadGoogleMaps().then(() => {
      const google = (window as any).google
      if (!originRef.current || !destRef.current) return

      const acOrigin = new google.maps.places.Autocomplete(originRef.current, { componentRestrictions: { country: 'ph' } })
      acOrigin.addListener('place_changed', () => {
        const p = acOrigin.getPlace()
        setOrigin(p.name ? `${p.name}, ${p.formatted_address}` : p.formatted_address || '')
      })

      const acDest = new google.maps.places.Autocomplete(destRef.current, { componentRestrictions: { country: 'ph' } })
      acDest.addListener('place_changed', () => {
        const p = acDest.getPlace()
        setDestination(p.name ? `${p.name}, ${p.formatted_address}` : p.formatted_address || '')
      })
    }).catch(console.error)
  }, [])

  const handleSearch = async () => {
    if (!origin || !destination) {
      setError('Please set both origin and destination.')
      return
    }
    setLoading(true)
    setError(null)
    setRoutes([])
    setPinMode(null)

    try {
      const res = await fetch(`${API_BASE}/routes?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&route_mode=${routeMode}`)
      const data = await res.json()
      
      if (data.error) setError(data.error)
      else if (data.routes?.length > 0) {
        // Decode geometry for map
        const decoded = data.routes.map((r: any) => ({
          ...r,
          legs: r.legs.map((l: any) => ({
            ...l,
            path: l.geometry ? polyline.decode(l.geometry) as [number, number][] : []
          }))
        }))
        setRoutes(decoded)
        setSelIdx(0)
        setAilaTip(data.aila_tip || 'Here is your route!')
      } else {
        setError('No routes found for this search.')
      }
    } catch (e) {
      setError('Cannot connect to server.')
    }
    setLoading(false)
  }

  const pRoute = routes[selIdx]

  return (
    <div className="flex h-screen bg-blue-50 flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <div className="w-full md:w-[400px] bg-white border-r border-blue-200 flex flex-col shadow-lg z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-blue-100 bg-blue-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1">
              <img src="/aila-body-only.png" alt="Aila" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Aila Transit</h2>
              <span className="text-blue-200 text-xs flex items-center gap-1">
                <CheckCircle2 size={12} /> Hi, {user.firstName}!
              </span>
            </div>
          </div>
          <button onClick={onLogout} className="text-sm bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Inputs */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 mb-6">
            
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-blue-400">
                <MapPin size={20} />
              </div>
              <input
                ref={originRef}
                type="text"
                placeholder="Origin (Saan galing?)"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-10 pr-10 p-4 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-blue-50/50 text-blue-900"
              />
              <button onClick={() => setPinMode('origin')} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg ${pinMode === 'origin' ? 'bg-blue-500 text-white' : 'text-blue-400 hover:bg-blue-100'}`}>
                <MapPin size={16} />
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-blue-400">
                <Navigation size={20} />
              </div>
              <input
                ref={destRef}
                type="text"
                placeholder="Destination (Saan pupunta?)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-10 p-4 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-blue-50/50 text-blue-900"
              />
              <button onClick={() => setPinMode('destination')} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg ${pinMode === 'destination' ? 'bg-red-500 text-white' : 'text-blue-400 hover:bg-blue-100'}`}>
                <MapPin size={16} />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-bold text-blue-900 mb-2 block">Pili ka ng mode:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'tipid', icon: Wallet },
                { id: 'mabilis', icon: Zap },
                { id: 'komportable', icon: ShieldCheck },
                { id: 'balanced', icon: Scale }
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setRouteMode(id as RouteMode)}
                  className={`p-3 rounded-xl border font-bold capitalize transition-colors flex items-center justify-center gap-2 ${
                    routeMode === id 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <Icon size={18} /> {id}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-4 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Clock size={20} className="animate-spin" /> : <Search size={20} />}
            {loading ? 'Naghahanap...' : 'Hanapin ang Ruta'}
          </button>

          {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">{error}</div>}

          {/* Results List */}
          {routes.length > 0 && pRoute && (
            <div className="mt-6 border-t border-blue-100 pt-6">
              
              {/* Aila Tip */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-4">
                <img src="/aila-body-only.png" className="w-10 h-10 rounded-full bg-white border border-blue-200 p-1 object-contain" />
                <div className="text-blue-900 text-sm font-medium pt-1">
                  {ailaTip}
                </div>
              </div>

              {/* Top Result Card */}
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-5 text-white shadow-lg mb-4">
                <div className="text-3xl font-extrabold mb-1">₱{pRoute.grand_total_fare.toFixed(2)}</div>
                <div className="text-blue-200 text-sm mb-4">
                  {pRoute.total_distance_km} km · {fmtMins(pRoute.total_duration_mins)}
                </div>
                
                {/* Legs visualization */}
                <div className="bg-white/10 rounded-xl p-3">
                  {pRoute.legs.map((leg: any, i: number) => {
                    const isWalk = leg.type === 'WALKING';
                    return (
                      <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isWalk ? 'bg-white/20' : 'bg-blue-500'}`}>
                          {getVehicleIcon(leg.type, leg.vehicle_type)}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="font-bold text-sm">
                            {isWalk ? 'Walk' : (leg.line || leg.vehicle_type || 'Transit')}
                          </div>
                          <div className="text-xs text-blue-200">
                            {fmtMins(leg.duration_mins)} {isWalk ? '' : `· ₱${leg.fare.toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-blue-100 z-0">
        
        {/* Pinning Instructions Banner */}
        {pinMode && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-full text-white font-bold shadow-lg flex items-center gap-2 ${pinMode === 'origin' ? 'bg-blue-600' : 'bg-red-500'}`}>
            <MapPin size={20} />
            Click on the map to pin {pinMode}
          </div>
        )}

        <MapContainer center={[14.5995, 120.9842]} zoom={13} className="w-full h-full" zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          <MapClickHandler 
            pinMode={pinMode} 
            onPin={(lat, lng, label) => {
              if (pinMode === 'origin') setOrigin(label)
              else setDestination(label)
              setPinMode(null)
            }} 
          />
          
          {pRoute && (
            <>
              <FitBounds paths={pRoute.legs.map((l: any) => l.path || [])} />
              {pRoute.legs.map((leg: any, idx: number) => {
                if (!leg.path || leg.path.length === 0) return null
                const isWalking = leg.type === 'WALKING'
                return (
                  <Polyline 
                    key={idx} 
                    positions={leg.path} 
                    color={getLegColor(leg.type, idx)} 
                    weight={isWalking ? 4 : 6}
                    dashArray={isWalking ? '10, 10' : undefined}
                  />
                )
              })}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  )
}