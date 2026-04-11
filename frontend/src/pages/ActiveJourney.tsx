import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import polyline from '@mapbox/polyline'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, X, Send, Crosshair, PauseCircle, ChevronRight, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { tripsApi, ailaApi } from '../config/api'

// --- Map Config ---
const userIcon = L.divIcon({
  className: '',
  html: `<div style="width: 20px; height: 20px; background-color: #3b82f6; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 12px rgba(59,130,246,0.6);"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10]
})

function MapFitter({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length > 0) map.fitBounds(L.latLngBounds(coords), { padding: [60, 60] })
  }, [coords, map])
  return null
}

const EMOTION_ASSETS: Record<string, string> = {
  relax: '/aila-relax.png',
  thinking: '/aila-thinking.png',
  "reading-map": '/aila-reading-map.png',
  celebrating: '/aila-celebrating.png',
  confused: '/aila-confused.png',
  apolegitic: '/aila-apolegitic.png',
  waving: '/aila-waving.png'
}

const EMOTION_ANIMATIONS: Record<string, string> = {
  relax: 'animate-aila-float',
  waving: 'animate-aila-float',
  thinking: 'animate-pulse',
  celebrating: 'animate-aila-celebrate',
  apolegitic: 'animate-aila-shake',
  confused: 'animate-aila-shake',
}

interface ChatMessage {
  role: 'aila' | 'user';
  text: string;
}

export default function ActiveJourney() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const stateData = location.state as { tripId: number; route: any; origin: string; destination: string; mode: string } | null;
  const tripId = stateData?.tripId;
  const route = stateData?.route || { legs: [] };

  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [isLiveGPS, setIsLiveGPS] = useState(true)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [loadingAila, setLoadingAila] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'aila', text: "Ingat sa byahe! I'm tracking our route. If you need anything, tap my face to ask!" }
  ])
  const [currentEmotion, setCurrentEmotion] = useState('waving');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null)

  const decodedLegs = route.legs.map((leg: any) => ({
    ...leg,
    path: leg.geometry ? polyline.decode(leg.geometry) as [number, number][] : []
  }));

  useEffect(() => {
    if (!isLiveGPS) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => { console.warn(err); setIsLiveGPS(false); },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isLiveGPS]);

  const handleUpdateStatus = async (status: 'finished' | 'cancelled') => {
    if (!tripId) return;
    setIsUpdatingStatus(true);
    try {
      await tripsApi.updateStatus(tripId, status);
      navigate('/dashboard');
    } catch (err) {
      console.error('Status update failed', err);
      setIsUpdatingStatus(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingAila) return;

    const userText = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setLoadingAila(true);
    setCurrentEmotion('thinking');

    try {
      const response = await ailaApi.chat({
        text: userText,
        current_step: currentStepIdx + 1,
        total_steps: decodedLegs.length
      });
      
      const { text, emotion } = response.data;
      setCurrentEmotion(emotion || 'relax');
      setMessages(prev => [...prev, { role: 'aila', text }]);
    } catch (err) {
      setCurrentEmotion('confused');
      setMessages(prev => [...prev, { role: 'aila', text: "Oops, lost connection! Paki-try ulit, buddy!" }]);
    } finally {
      setLoadingAila(false);
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const currentStep = decodedLegs[currentStepIdx];
  const allRouteCoords = decodedLegs.flatMap((l: any) => l.path);

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden text-white">
      
      <header className="bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10 shrink-0 absolute top-0 w-full border-b border-slate-800">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white"><ArrowLeft size={24} /></button>
        <div className="text-center">
          <div className="font-extrabold text-[14px] uppercase tracking-tighter text-slate-400">TRIP #{tripId}</div>
          <div className="text-emerald-400 text-xs font-bold animate-pulse">● {decodedLegs.length - currentStepIdx} steps left</div>
        </div>
        <button onClick={() => setIsLiveGPS(!isLiveGPS)} className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${isLiveGPS ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
          {isLiveGPS ? <Crosshair size={14} className="animate-spin-slow" /> : <PauseCircle size={14} />}
          {isLiveGPS ? 'LIVE' : 'FIXED'}
        </button>
      </header>

      <div className="flex-1 relative z-0">
        <MapContainer center={[14.5995, 120.9842]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {allRouteCoords.length > 0 && <MapFitter coords={allRouteCoords} />}
          {decodedLegs.map((leg: any, i: number) => (
            <Polyline key={i} positions={leg.path} color={i < currentStepIdx ? '#334155' : i === currentStepIdx ? '#4f46e5' : '#1e293b'} weight={i === currentStepIdx ? 8 : 4} />
          ))}
          {userLocation && <Marker position={userLocation} icon={userIcon} />}
        </MapContainer>
      </div>

      <div className="absolute bottom-0 w-full z-10 pointer-events-none pb-6 px-4 flex flex-col items-center">
        
        {/* AILA FLOATING MASCOT */}
        <div className="w-full flex justify-end mb-4 pointer-events-auto max-w-lg">
          <div className="relative group">
            {!isChatOpen && (
              <div className="absolute -top-12 right-0 bg-white text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-2xl shadow-xl animate-bounce">
                ASK ME!
              </div>
            )}
            <button onClick={() => setIsChatOpen(true)} className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-slate-900 overflow-hidden relative transition-transform active:scale-90">
              <img 
                src={EMOTION_ASSETS[currentEmotion]} 
                className={`w-[120%] h-[120%] object-contain absolute bottom-[-10%] ${EMOTION_ANIMATIONS[currentEmotion]}`} 
                alt="Aila"
              />
            </button>
          </div>
        </div>

        {/* CURRENT STEP CARD */}
        {currentStep && (
          <div className="bg-white rounded-[32px] p-6 shadow-2xl pointer-events-auto border border-slate-200 text-slate-900 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-widest">Step {currentStepIdx + 1} of {decodedLegs.length}</span>
              <button onClick={() => handleUpdateStatus('cancelled')} className="text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors"><XCircle size={20}/></button>
            </div>
            
            <h2 className="text-xl font-black text-slate-900 mb-6 leading-tight min-h-[3rem]">
              {currentStep.instructions.replace(/<[^>]*>?/gm, '') || "Continue straight"}
            </h2>

            <div className="flex gap-3">
              <button disabled={currentStepIdx === 0} onClick={() => setCurrentStepIdx(prev => prev - 1)} className="p-4 bg-slate-100 rounded-2xl text-slate-400 disabled:opacity-30"><ArrowLeft size={20}/></button>
              
              {currentStepIdx < decodedLegs.length - 1 ? (
                <button onClick={() => setCurrentStepIdx(prev => prev + 1)} className="flex-1 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                  Next Step <ChevronRight size={18}/>
                </button>
              ) : (
                <button 
                  onClick={() => handleUpdateStatus('finished')} 
                  disabled={isUpdatingStatus}
                  className="flex-1 bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                  {isUpdatingStatus ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18} />} 
                  ARRIVED
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CHAT INTERFACE */}
      <div className={`absolute bottom-0 w-full bg-white z-50 rounded-t-[40px] shadow-2xl transition-all duration-500 ease-out flex flex-col ${isChatOpen ? 'h-[85vh]' : 'h-0 overflow-hidden'}`}>
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden border border-indigo-100">
              <img src={EMOTION_ASSETS[currentEmotion]} className={EMOTION_ANIMATIONS[currentEmotion]} />
            </div>
            <div>
              <p className="font-black text-slate-900 leading-none mb-1">Aila Buddy</p>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Active Tracking</p>
            </div>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="p-3 bg-white text-slate-400 rounded-2xl hover:text-rose-500 shadow-sm border border-slate-100"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${
                msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100 shadow-lg' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loadingAila && (
             <div className="flex justify-start animate-pulse">
               <div className="bg-white p-4 rounded-3xl rounded-bl-none border border-slate-100 text-slate-400 text-xs font-bold tracking-widest">AILA IS TYPING...</div>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-50">
          <div className="relative">
            <input 
              type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              placeholder="E.g. Malayo pa ba?"
              className="w-full pl-6 pr-16 py-5 bg-slate-100 border-none rounded-[24px] text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all text-slate-900"
            />
            <button type="submit" disabled={!chatInput.trim()} className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 text-white rounded-[18px] shadow-lg shadow-indigo-200 disabled:opacity-20">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {isChatOpen && <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsChatOpen(false)} />}
    </div>
  )
}