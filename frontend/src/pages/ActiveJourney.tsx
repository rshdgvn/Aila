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
  MapPin,
  Navigation,
  Clock,
} from "lucide-react";
import { tripsApi, ailaApi } from "../config/api";

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width: 24px; height: 24px; background-color: #4f46e5; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 14px rgba(79,70,229,0.5);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.divIcon({
  className: "custom-pin",
  html: `<div class="w-8 h-8 bg-[#0d1f5c] rounded-full border-[3px] border-white shadow-lg flex items-center justify-center"><div class="w-2.5 h-2.5 bg-white rounded-full"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

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
  waving: "/aila-relax.png",
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

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isLiveGPS, setIsLiveGPS] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

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

  const finalLeg = decodedLegs[decodedLegs.length - 1];
  const destinationCoords =
    finalLeg && finalLeg.path.length > 0
      ? finalLeg.path[finalLeg.path.length - 1]
      : null;

  useEffect(() => {
    if (!isLiveGPS) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        setIsLiveGPS(false);
        console.error("Error getting location:", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isLiveGPS]);

  useEffect(() => {
    if (!userLocation || decodedLegs.length === 0) return;

    const currentLeg = decodedLegs[currentStepIdx];
    if (!currentLeg || !currentLeg.path || currentLeg.path.length === 0) return;

    const legEnd = currentLeg.path[currentLeg.path.length - 1];
    const dist = getDistance(
      userLocation[0],
      userLocation[1],
      legEnd[0],
      legEnd[1],
    );

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

  const handleUpdateStatus = async (status: "finished" | "cancelled") => {
    if (!tripId) return;
    setIsUpdatingStatus(true);
    try {
      await tripsApi.updateStatus(tripId, status);
      localStorage.removeItem(`active_trip_${tripId}`);
      navigate("/dashboard");
    } catch (err) {
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
      const currentInstruction =
        decodedLegs[currentStepIdx]?.instructions?.replace(/<[^>]*>?/gm, "") ||
        "";

      const response = await ailaApi.chat({
        text: userText,
        current_step: currentStepIdx + 1,
        total_steps: decodedLegs.length,
        origin: routeInfo?.origin,
        destination: routeInfo?.destination,
        mode: routeInfo?.mode,
        user_lat: userLocation ? userLocation[0] : undefined,
        user_lng: userLocation ? userLocation[1] : undefined,
        current_instruction: currentInstruction,
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

  const handleNextStepDemo = () => {
    setIsLiveGPS(false);
    const nextIdx = currentStepIdx + 1;
    setCurrentStepIdx(nextIdx);

    const nextLeg = decodedLegs[nextIdx];
    if (nextLeg && nextLeg.path && nextLeg.path.length > 0) {
      setUserLocation(nextLeg.path[0]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingAila]);

  if (!routeInfo) {
    return (
      <div className="h-[100svh] bg-slate-50 flex items-center justify-center flex-col gap-5">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
        <p className="text-slate-500 font-bold tracking-wide">
          Plotting your journey...
        </p>
      </div>
    );
  }

  const remainingCoords = decodedLegs
    .slice(currentStepIdx)
    .flatMap((l: any) => l.path);
  const allRouteCoords = decodedLegs.flatMap((l: any) => l.path);

  return (
    <div
      className="h-[100svh] bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden text-slate-900"
      style={{ fontFamily: '"Inter", sans-serif' }}
    >
      <div className="w-full md:w-[380px] lg:w-[420px] bg-[#f8f9ff] border-r border-indigo-100 flex flex-col z-20 shadow-2xl shrink-0 h-[55vh] md:h-full transition-all">
        <header className="p-4 sm:p-6 border-b border-indigo-50 bg-white flex items-center gap-4 sm:gap-5 shrink-0 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl"></div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative">
            <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl pointer-events-none opacity-60"></div>
            <img
              src={EMOTION_ASSETS[currentEmotion] || "/aila-relax.png"}
              className="w-full h-full object-contain relative z-10 transition-all duration-500 drop-shadow-lg"
              alt="Aila"
            />
          </div>
          <div className="flex flex-col z-10 min-w-0">
            <h2
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="font-extrabold text-[#0d1f5c] text-xl sm:text-2xl tracking-tight"
            >
              Aila
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <p className="text-[11px] sm:text-[12px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Assisting you live
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white no-scrollbar">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-2 sm:gap-3 max-w-[88%] sm:max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "aila" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src="/aila-relax.png"
                      className="w-5 h-5 sm:w-6 sm:h-6 object-cover mt-2"
                      alt="Aila"
                    />
                  </div>
                )}

                <div
                  className={`p-3 sm:p-4 text-[13px] sm:text-[14px] font-bold leading-relaxed shadow-sm transition-all ${
                    msg.role === "user"
                      ? "bg-[#0d1f5c] text-white rounded-[20px] rounded-tr-sm shadow-indigo-900/10"
                      : "bg-[#f8f9ff] text-[#0d1f5c] border border-indigo-50 rounded-[20px] rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loadingAila && (
            <div className="flex justify-start w-full">
              <div className="flex gap-2 sm:gap-3 max-w-[85%]">
                <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm flex items-center justify-center overflow-hidden">
                  <img
                    src="/aila-thinking.png"
                    className="w-5 h-5 sm:w-6 sm:h-6 object-cover mt-2"
                    alt="Aila"
                  />
                </div>
                <div className="bg-[#f8f9ff] px-4 sm:px-5 py-3 sm:py-4 rounded-[20px] rounded-tl-sm border border-indigo-50 shadow-sm flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-indigo-400/80 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} className="h-2" />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 sm:p-5 bg-white border-t border-indigo-50 shrink-0 shadow-[0_-10px_40px_rgba(13,31,92,0.03)]"
        >
          <div className="relative flex items-center group">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Aila for directions, tips..."
              className="w-full pl-4 sm:pl-5 pr-14 sm:pr-16 py-3.5 sm:py-4 bg-[#f8f9ff] border border-indigo-100 rounded-2xl text-[13px] sm:text-[14px] font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all outline-none text-[#0d1f5c] placeholder:text-slate-400 shadow-inner"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="absolute right-2.5 w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-40 hover:bg-indigo-700 transition-all active:scale-90 flex items-center justify-center group-focus-within:bg-[#0d1f5c]"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 relative z-0 h-[45vh] md:h-full">
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-[400] flex justify-between items-start pointer-events-none">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-600 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:text-[#0d1f5c] hover:border-indigo-200 pointer-events-auto transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex flex-col items-end gap-2 sm:gap-3 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-2 sm:gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-[11px] sm:text-[12px] font-black tracking-widest text-[#0d1f5c] uppercase">
                Trip #{tripId ? String(tripId).slice(-4) : "ACTIVE"}
              </span>
            </div>

            <button
              onClick={() => setIsLiveGPS(!isLiveGPS)}
              className={`px-3 sm:px-5 py-2 sm:py-3 rounded-2xl text-[11px] sm:text-[12px] font-black uppercase tracking-widest shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-2 transition-all border backdrop-blur-md ${
                isLiveGPS
                  ? "bg-indigo-50/95 border-indigo-200 text-indigo-700"
                  : "bg-white/95 border-slate-200/80 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {isLiveGPS ? (
                <Crosshair
                  size={14}
                  className="animate-spin-slow text-indigo-500"
                />
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
          style={{ height: "100%", width: "100%", backgroundColor: "#f8fafc" }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

          {remainingCoords.length > 0 ? (
            <MapFitter coords={remainingCoords} />
          ) : (
            allRouteCoords.length > 0 && <MapFitter coords={allRouteCoords} />
          )}

          {decodedLegs.map((leg: any, i: number) => {
            const isPast = i < currentStepIdx;
            const isCurrent = i === currentStepIdx;
            const isFuture = i > currentStepIdx;

            return (
              <Polyline
                key={`${i}-${currentStepIdx}`}
                positions={leg.path}
                pathOptions={{
                  color: isCurrent ? "#4f46e5" : isPast ? "#0d1f5c" : "#cbd5e1",
                  weight: isCurrent ? 8 : 5,
                  dashArray: isFuture ? "10, 12" : undefined,
                  lineCap: "round",
                  lineJoin: "round",
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

      <div className="w-full md:w-[400px] lg:w-[440px] bg-white border-l border-indigo-50 flex flex-col z-20 shadow-2xl shrink-0 h-[45vh] md:h-full">
        <header className="px-5 sm:px-7 py-4 sm:py-6 border-b border-indigo-50 shrink-0 bg-white z-10">
          <div className="flex justify-between items-end">
            <div>
              <h2
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="font-extrabold text-[#0d1f5c] text-xl sm:text-2xl tracking-tight"
              >
                Route Details
              </h2>
              <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                <Navigation size={13} className="text-indigo-500" />
                <p className="text-[12px] sm:text-[13px] text-slate-500 font-bold">
                  {decodedLegs.length - currentStepIdx} steps remaining
                </p>
              </div>
            </div>

            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-4 border-slate-100 flex items-center justify-center relative shrink-0">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="22"
                  cy="22"
                  r="20"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="4"
                  strokeDasharray="125"
                  strokeDashoffset={
                    125 -
                    125 * (currentStepIdx / Math.max(1, decodedLegs.length - 1))
                  }
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="text-[10px] font-black text-[#0d1f5c]">
                {Math.round(
                  (currentStepIdx / Math.max(1, decodedLegs.length - 1)) * 100,
                )}
                %
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-7 bg-white relative no-scrollbar">
          <div className="flex flex-col">
            {decodedLegs.map((leg: any, idx: number) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              const distStr =
                leg.distance_text ||
                (leg.distance_km ? `${leg.distance_km} km` : null);
              const durStr =
                leg.duration_text ||
                (leg.duration_mins
                  ? `${Math.round(leg.duration_mins)} mins`
                  : null);

              return (
                <div
                  key={idx}
                  className={`flex gap-4 sm:gap-5 transition-all duration-300 ${isPast ? "opacity-60" : "opacity-100"}`}
                >
                  <div className="shrink-0 flex flex-col items-center w-8 sm:w-9">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full border-2 flex items-center justify-center relative z-10 transition-colors duration-300 ${
                        isCurrent
                          ? "bg-[#0d1f5c] border-[#0d1f5c] text-white shadow-md"
                          : isPast
                            ? "bg-indigo-500 border-indigo-500 text-white"
                            : "bg-white border-slate-200 text-slate-400"
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
                    <div
                      className={`w-[2px] flex-1 my-1 transition-colors duration-300 ${isPast ? "bg-indigo-500" : "bg-slate-100"}`}
                    ></div>
                  </div>

                  <div className="flex-1 pb-5 sm:pb-6 min-w-0">
                    <div
                      className={`p-3 sm:p-4 rounded-2xl ${
                        isCurrent
                          ? "bg-[#f8f9ff] border border-indigo-100 shadow-sm"
                          : isPast
                            ? "bg-transparent border border-transparent"
                            : "bg-white border border-slate-100"
                      }`}
                    >
                      {isCurrent && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-100 px-2 py-1 rounded-md">
                            Current Step
                          </span>
                        </div>
                      )}

                      <p
                        className={`text-[13px] sm:text-[14px] font-bold leading-relaxed ${isCurrent ? "text-[#0d1f5c]" : "text-slate-600"}`}
                        dangerouslySetInnerHTML={{
                          __html: leg.instructions || "Proceed to route",
                        }}
                      />

                      <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
                        {distStr && (
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 tracking-wide">
                            <MapPin size={12} className="text-indigo-400" />{" "}
                            {distStr}
                          </div>
                        )}
                        {durStr && (
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 tracking-wide">
                            <Clock size={12} className="text-indigo-400" />{" "}
                            {durStr}
                          </div>
                        )}
                        {leg.estimated_fare > 0 && (
                          <div className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-black rounded border border-indigo-100 shadow-sm">
                            ₱{leg.estimated_fare.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-4 sm:gap-5 opacity-80">
              <div className="shrink-0 flex flex-col items-center w-8 sm:w-9">
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center relative z-10">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0d1f5c] border-[3px] border-white shadow-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex-1 py-1.5">
                <p className="text-[13px] sm:text-[14px] font-extrabold text-[#0d1f5c]">
                  Destination Reached
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white border-t border-indigo-50 shrink-0 space-y-2 sm:space-y-3 z-20">
          {currentStepIdx < decodedLegs.length - 1 ? (
            <button
              onClick={handleNextStepDemo}
              className="w-full py-4 bg-[#f8f9ff] hover:bg-indigo-50 border border-indigo-100 text-[#0d1f5c] font-extrabold text-[13px] sm:text-[14px] rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              Next Step{" "}
              <span className="text-indigo-400 text-[11px] uppercase tracking-wider font-black">
                (Demo)
              </span>
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus("finished")}
              disabled={isUpdatingStatus}
              className="w-full py-4 bg-[#0d1f5c] hover:bg-indigo-900 text-white font-extrabold text-[13px] sm:text-[14px] rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all"
            >
              {isUpdatingStatus ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
              Complete Journey
            </button>
          )}

          <button
            onClick={() => handleUpdateStatus("cancelled")}
            disabled={isUpdatingStatus}
            className="w-full py-3 sm:py-3.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-extrabold text-[12px] sm:text-[13px] rounded-2xl flex items-center justify-center gap-2 border border-slate-200 hover:border-rose-200 transition-all active:scale-[0.98]"
          >
            <XCircle size={16} /> Cancel Trip
          </button>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-pin { overflow: visible !important; }
      `}</style>
    </div>
  );
}
