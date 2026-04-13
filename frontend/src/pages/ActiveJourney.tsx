import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Send,
  Crosshair,
  PauseCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Footprints,
  Train,
  Car,
} from "lucide-react";
import { tripsApi, ailaApi } from "../config/api";

// --- Map Config ---
const userIcon = L.divIcon({
  className: "",
  html: `<div style="width: 24px; height: 24px; background-color: #4f46e5; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 14px rgba(79,70,229,0.5);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.divIcon({
  className: "custom-pin",
  html: `<div class="w-6 h-6 bg-[#0d1f5c] rounded-full border-[3px] border-white shadow-md"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Dynamic Map Fitter (Flies to the remaining route smoothly)
function MapFitter({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      map.flyToBounds(L.latLngBounds(coords), {
        padding: [80, 80],
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [coords, map]);
  return null;
}

// Haversine Formula for distance calculation (in meters)
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const EMOTION_ASSETS: Record<string, string> = {
  relax: "/aila-relax.png",
  thinking: "/aila-thinking.png",
  "reading-map": "/aila-reading-map.png",
  celebrating: "/aila-celebrating.png",
  confused: "/aila-confused.png",
  apolegitic: "/aila-apolegitic.png",
  waving: "/aila-relax.png", // Fallback if waving doesn't exist
};

interface ChatMessage {
  role: "aila" | "user";
  text: string;
}

export default function ActiveJourney() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as any;
  const tripId = stateData?.tripId;

  // --- State Persistence ---
  const [routeInfo, setRouteInfo] = useState<any>(null);

  useEffect(() => {
    if (stateData?.route) {
      const info = {
        route: stateData.route,
        origin: stateData.origin,
        destination: stateData.destination,
        mode: stateData.mode,
      };
      setRouteInfo(info);
      localStorage.setItem(`active_trip_${tripId}`, JSON.stringify(info));
    } else if (tripId) {
      const saved = localStorage.getItem(`active_trip_${tripId}`);
      if (saved) setRouteInfo(JSON.parse(saved));
    }
  }, [stateData, tripId]);

  // --- State ---
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isLiveGPS, setIsLiveGPS] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [loadingAila, setLoadingAila] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "aila",
      text: "Ingat sa byahe! I'm tracking our route. If you need anything, just chat with me here!",
    },
  ]);
  const [currentEmotion, setCurrentEmotion] = useState("relax");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const decodedLegs =
    routeInfo?.route?.legs?.map((leg: any) => ({
      ...leg,
      path: leg.geometry
        ? (polyline.decode(leg.geometry) as [number, number][])
        : [],
    })) || [];

  // Get the absolute final coordinate for the destination pin
  const finalLeg = decodedLegs[decodedLegs.length - 1];
  const destinationCoords =
    finalLeg && finalLeg.path.length > 0
      ? finalLeg.path[finalLeg.path.length - 1]
      : null;

  // --- GPS Tracking ---
  useEffect(() => {
    if (!isLiveGPS) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        console.warn("GPS Error:", err);
        setIsLiveGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isLiveGPS]);

  // --- Auto-Advance Step based on GPS Location ---
  useEffect(() => {
    if (!userLocation || decodedLegs.length === 0) return;

    const currentLeg = decodedLegs[currentStepIdx];
    if (!currentLeg || !currentLeg.path || currentLeg.path.length === 0) return;

    // Get the last coordinate of the current step
    const legEnd = currentLeg.path[currentLeg.path.length - 1];
    const dist = getDistance(
      userLocation[0],
      userLocation[1],
      legEnd[0],
      legEnd[1],
    );

    // Kung ang user ay less than 50 meters sa dulo ng step, auto next step na!
    if (dist < 50 && currentStepIdx < decodedLegs.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);

      setMessages((prev) => [
        ...prev,
        {
          role: "aila",
          text: "Nice! We reached a checkpoint. Let's head to the next step.",
        },
      ]);
      setCurrentEmotion("reading-map");
    }
  }, [userLocation, currentStepIdx, decodedLegs]);

  // --- Handlers ---
  const handleUpdateStatus = async (status: "finished" | "cancelled") => {
    if (!tripId) return;
    setIsUpdatingStatus(true);
    try {
      await tripsApi.updateStatus(tripId, status);
      localStorage.removeItem(`active_trip_${tripId}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Status update failed", err);
      setIsUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingAila) return;

    const userText = chatInput.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setChatInput("");
    setLoadingAila(true);
    setCurrentEmotion("thinking");

    try {
      const response = await ailaApi.chat({
        text: userText,
        current_step: currentStepIdx + 1,
        total_steps: decodedLegs.length,
      });
      setCurrentEmotion(response.data.emotion || "relax");
      setMessages((prev) => [
        ...prev,
        { role: "aila", text: response.data.text },
      ]);
    } catch (err) {
      setCurrentEmotion("confused");
      setMessages((prev) => [
        ...prev,
        { role: "aila", text: "Oops, lost connection! Paki-try ulit, buddy!" },
      ]);
    } finally {
      setLoadingAila(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!routeInfo) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-bold">Loading your journey data...</p>
      </div>
    );
  }

  // Get only the remaining coordinates to focus the map dynamically
  const remainingCoords = decodedLegs
    .slice(currentStepIdx)
    .flatMap((l: any) => l.path);
  const allRouteCoords = decodedLegs.flatMap((l: any) => l.path);

  return (
    <div
      className="h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden text-slate-900"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      {/* LEFT COLUMN: Aila Chat Interface */}
      <div className="w-full md:w-[360px] lg:w-[400px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl shrink-0 h-[45vh] md:h-full">
        <header className="p-5 border-b border-slate-100 bg-white flex items-center gap-4 shrink-0">
          <div className="w-32 h-32 shrink-0 relative">
            <div className="absolute inset-0 bg-indigo-50 rounded-full blur-2xl pointer-events-none"></div>
            <img
              src={EMOTION_ASSETS[currentEmotion] || "/aila-relax.png"}
              className="w-full h-full object-contain relative z-10 transition-all duration-300 drop-shadow-md"
              alt="Aila"
            />
          </div>
          <div className="flex flex-col">
            <h2
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="font-extrabold text-[#0d1f5c] text-xl tracking-tight"
            >
              Aila
            </h2>
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
              Your trip assistant
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 no-scrollbar">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-[20px] text-[13px] font-semibold leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-[#0d1f5c] text-white rounded-br-sm"
                    : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loadingAila && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-[20px] rounded-bl-sm border border-slate-200 shadow-sm flex gap-2 items-center">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-slate-100 shrink-0"
        >
          <div className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-[#0d1f5c] placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl shadow-md disabled:opacity-30 hover:bg-indigo-700 transition-colors active:scale-95 flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* MIDDLE COLUMN: Map */}
      <div className="flex-1 relative z-0 h-[30vh] md:h-full">
        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 right-4 z-[400] flex justify-between items-start pointer-events-none">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-12 h-12 bg-white/90 backdrop-blur border border-slate-200 text-slate-600 rounded-full flex items-center justify-center shadow-lg hover:text-[#0d1f5c] pointer-events-auto transition-transform active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur px-4 py-2 border border-slate-200 rounded-2xl shadow-lg flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-black tracking-widest text-[#0d1f5c] uppercase">
                Trip #{tripId}
              </span>
            </div>
            <button
              onClick={() => setIsLiveGPS(!isLiveGPS)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all border ${isLiveGPS ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              {isLiveGPS ? (
                <Crosshair size={14} className="animate-spin-slow" />
              ) : (
                <PauseCircle size={14} />
              )}
              {isLiveGPS ? "Tracking Live" : "GPS Paused"}
            </button>
          </div>
        </div>

        <MapContainer
          center={[14.5995, 120.9842]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          {/* Dynamically refit the map whenever the remaining route changes */}
          {remainingCoords.length > 0 ? (
            <MapFitter coords={remainingCoords} />
          ) : (
            allRouteCoords.length > 0 && <MapFitter coords={allRouteCoords} />
          )}

          {decodedLegs.map((leg: any, i: number) => {
            const isPassedOrCurrent = i <= currentStepIdx;
            const isFuture = i > currentStepIdx;
            const isActiveStep = i === currentStepIdx;

            return (
              <Polyline
                key={`${i}-${currentStepIdx}`}
                positions={leg.path}
                pathOptions={{
                  color: isPassedOrCurrent ? "#4f46e5" : "#cbd5e1",
                  weight: isActiveStep ? 7 : 5,
                  dashArray: isFuture ? "8, 8" : undefined,
                }}
              />
            );
          })}
          {userLocation && <Marker position={userLocation} icon={userIcon} />}
          {destinationCoords && (
            <Marker
              position={destinationCoords as [number, number]}
              icon={destIcon}
            />
          )}
        </MapContainer>
      </div>

      {/* RIGHT COLUMN: Journey Tracking */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl shrink-0 h-[45vh] md:h-full">
        <header className="px-6 py-5 border-b border-slate-100 shrink-0">
          <h2
            style={{ fontFamily: '"Sora", sans-serif' }}
            className="font-extrabold text-[#0d1f5c] text-xl tracking-tight"
          >
            Your Route
          </h2>
          <p className="text-sm text-slate-500 font-bold mt-1">
            {decodedLegs.length - currentStepIdx} steps remaining
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative no-scrollbar">
          <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-200 rounded-full z-0"></div>

          <div className="space-y-6 relative z-10">
            {decodedLegs.map((leg: any, idx: number) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={idx}
                  className={`flex gap-4 transition-all duration-300 ${isPast ? "opacity-50" : "opacity-100"} ${isCurrent ? "scale-105 transform origin-left" : ""}`}
                >
                  <div className="shrink-0 flex flex-col items-center pt-1">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm ${
                        isCurrent
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/30"
                          : isPast
                            ? "bg-indigo-100 border-indigo-200 text-indigo-400"
                            : "bg-white border-slate-300 text-slate-400"
                      }`}
                    >
                      {leg.type === "WALKING" ? (
                        <Footprints size={14} />
                      ) : leg.type === "TRANSIT" ? (
                        <Train size={14} />
                      ) : (
                        <Car size={14} />
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex-1 p-4 rounded-2xl border ${isCurrent ? "bg-white border-indigo-200 shadow-lg shadow-indigo-900/5" : "bg-transparent border-transparent"}`}
                  >
                    {isCurrent && (
                      <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                        Current Step
                      </div>
                    )}
                    <p
                      className={`text-[13px] font-bold leading-snug ${isCurrent ? "text-[#0d1f5c]" : "text-slate-600"}`}
                    >
                      {leg.instructions.replace(/<[^>]*>?/gm, "")}
                    </p>
                    {leg.estimated_fare > 0 && (
                      <div className="mt-2 inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded-md border border-emerald-100">
                        ₱{leg.estimated_fare.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 bg-white border-t border-slate-100 shrink-0 space-y-3 shadow-[0_-15px_30px_rgba(13,31,92,0.03)]">
          {currentStepIdx < decodedLegs.length - 1 ? (
            <button
              onClick={() => setCurrentStepIdx((prev) => prev + 1)}
              className="w-full py-4 bg-[#0d1f5c] hover:bg-indigo-900 text-white font-extrabold text-sm rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all"
            >
              Next Step (Manual Override)
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus("finished")}
              disabled={isUpdatingStatus}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all"
            >
              {isUpdatingStatus ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
              Complete Trip
            </button>
          )}

          <button
            onClick={() => handleUpdateStatus("cancelled")}
            disabled={isUpdatingStatus}
            className="w-full py-3.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 border border-slate-200 hover:border-rose-200 transition-all active:scale-[0.98]"
          >
            <XCircle size={18} /> Cancel Trip
          </button>
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .custom-pin { overflow: visible !important; }`}</style>
    </div>
  );
}
