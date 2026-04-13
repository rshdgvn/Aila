import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import polyline from "@mapbox/polyline";
import {
  ArrowLeft,
  MapPin,
  LocateFixed,
  Car,
  Bus,
  UserSquare2,
  Loader2,
  Search,
  Navigation,
} from "lucide-react";
import { routesApi, tripsApi } from "../config/api";
import { loadGoogleMaps, reverseGeocode } from "../config/utils";
import MapSection from "../components/MapSection";
import RouteOptions from "../components/RouteOptions";

export default function NewTravel() {
  const navigate = useNavigate();
  const [originStr, setOriginStr] = useState("");
  const [destStr, setDestStr] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(
    null,
  );
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [pinMode, setPinMode] = useState<"origin" | "destination" | null>(null);
  const [mode, setMode] = useState("transit");
  const [passengerType, setPassengerType] = useState("regular");
  const [loading, setLoading] = useState(false);
  const [routesData, setRoutesData] = useState<any>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [ailaMascot, setAilaMascot] = useState("/aila-relax.png");
  const [ailaMessages, setAilaMessages] = useState<string[]>([]);

  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        const google = (window as any).google;
        if (!originRef.current || !destRef.current) return;

        const acOrigin = new google.maps.places.Autocomplete(
          originRef.current,
          { componentRestrictions: { country: "ph" } },
        );
        acOrigin.addListener("place_changed", () => {
          const p = acOrigin.getPlace();
          setOriginStr(
            p.name
              ? `${p.name}, ${p.formatted_address}`
              : p.formatted_address || "",
          );
          if (p.geometry?.location)
            setOriginCoords([
              p.geometry.location.lat(),
              p.geometry.location.lng(),
            ]);
        });

        const acDest = new google.maps.places.Autocomplete(destRef.current, {
          componentRestrictions: { country: "ph" },
        });
        acDest.addListener("place_changed", () => {
          const p = acDest.getPlace();
          setDestStr(
            p.name
              ? `${p.name}, ${p.formatted_address}`
              : p.formatted_address || "",
          );
          if (p.geometry?.location)
            setDestCoords([
              p.geometry.location.lat(),
              p.geometry.location.lng(),
            ]);
        });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (loading) {
      setAilaMascot("/aila-reading-map.png");
      setAilaMessages([
        "Scanning the map and checking the latest LTFRB fares...",
      ]);
      return;
    }

    if (routesData && routesData.routes?.length > 0) {
      setAilaMascot("/aila-celebrating.png");
      const selected = routesData.routes[selectedRouteIdx || 0];

      let msg = `I found ${routesData.routes.length} options! `;
      if (selected?.insights?.includes("Fastest"))
        msg += "This one is the fastest route to beat the rush. ";
      else if (selected?.insights?.includes("Cheapest"))
        msg += "This path will save you the most money. ";
      else msg += "Here is a solid route for your trip. ";

      if (mode === "transit" && selected.transfer_count > 0) {
        msg += `Just a heads up, you'll need to transfer ${selected.transfer_count} time(s).`;
      }
      setAilaMessages([msg]);
      return;
    }

    setAilaMascot("/aila-relax.png");
    if (pinMode) {
      setAilaMessages([
        `Ready to drop a pin for your ${pinMode}? Just tap anywhere on the map!`,
      ]);
    } else if (!originCoords && !destCoords) {
      setAilaMessages(["Kamusta, buddy! Where are we heading for this trip?"]);
    } else {
      setAilaMessages([
        "Awesome! Type the full address or drop a pin for the other location.",
      ]);
    }
  }, [
    loading,
    routesData,
    selectedRouteIdx,
    mode,
    pinMode,
    originCoords,
    destCoords,
  ]);

  const handleMapPin = (lat: number, lng: number, address: string) => {
    if (pinMode === "origin") {
      setOriginCoords([lat, lng]);
      setOriginStr(address);
    } else if (pinMode === "destination") {
      setDestCoords([lat, lng]);
      setDestStr(address);
    }
    setPinMode(null);
  };

  const handleCurrentLocation = (type: "origin" | "destination") => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        if (type === "origin") {
          setOriginCoords([lat, lng]);
          setOriginStr(address);
        } else {
          setDestCoords([lat, lng]);
          setDestStr(address);
        }
      },
      () => alert("Unable to retrieve your location"),
    );
  };

  const handleSearch = async () => {
    const o = originCoords
      ? `${originCoords[0]},${originCoords[1]}`
      : originStr;
    const d = destCoords ? `${destCoords[0]},${destCoords[1]}` : destStr;
    if (!o || !d) return;

    setLoading(true);
    setRoutesData(null);
    setSelectedRouteIdx(null);
    setSaved(false);
    setPinMode(null);

    try {
      const data = await routesApi.getRoutes(o, d, mode, passengerType);
      const rawRoutes = data.routes || [];
      const uniqueRoutes = rawRoutes.filter(
        (route: any, index: number, self: any[]) =>
          index ===
          self.findIndex(
            (r) =>
              r.summary === route.summary &&
              r.total_distance_km === route.total_distance_km &&
              r.grand_total_fare === route.grand_total_fare,
          ),
      );

      const parsedRoutes = uniqueRoutes.map((route: any) => ({
        ...route,
        legs: route.legs.map((leg: any) => ({
          ...leg,
          path: leg.geometry
            ? polyline.decode(leg.geometry).map((p) => [p[0], p[1]])
            : [],
        })),
      }));

      setRoutesData({ ...data, routes: parsedRoutes });
      if (parsedRoutes.length > 0) setSelectedRouteIdx(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTripPayload = (route: any, status: string) => {
    const fullPath = route.legs
      ? route.legs.flatMap((leg: any) => leg.path || [])
      : [];
    const fullPolyline = fullPath.length > 0 ? polyline.encode(fullPath) : null;

    return {
      origin: originStr,
      destination: destStr,
      mode: mode,
      distance_km: Number(route.total_distance_km.toFixed(2)),
      duration_mins: Math.round(route.total_duration_mins),
      total_fare: route.grand_total_fare || 0,
      status,
      origin_lat: originCoords ? originCoords[0] : null,
      origin_lng: originCoords ? originCoords[1] : null,
      dest_lat: destCoords ? destCoords[0] : null,
      dest_lng: destCoords ? destCoords[1] : null,
      route_polyline: fullPolyline,
    };
  };

  const handleStartJourney = async () => {
    if (selectedRouteIdx === null || !routesData) return;
    const route = routesData.routes[selectedRouteIdx];
    setSaving(true);
    try {
      const res = await tripsApi.create(createTripPayload(route, "active"));
      setSaved(true);
      setTimeout(
        () =>
          navigate("/active-journey", {
            state: {
              tripId: res.data.id,
              route,
              origin: originStr,
              destination: destStr,
              mode,
            },
          }),
        1000,
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveForLater = async () => {
    if (selectedRouteIdx === null || !routesData) return;
    const route = routesData.routes[selectedRouteIdx];
    setSaving(true);
    try {
      await tripsApi.create(createTripPayload(route, "pending"));
      setSaved(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const activeRoute =
    selectedRouteIdx !== null && routesData
      ? routesData.routes[selectedRouteIdx]
      : null;

  return (
    <div
      className="h-screen bg-[#f0f4ff] flex flex-col md:flex-row text-[#0d1f5c] overflow-hidden"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      {/* ── LEFT COLUMN: Input Panel ── */}
      <div className="w-full md:w-[400px] lg:w-[420px] bg-white border-b md:border-b-0 md:border-r border-indigo-50 flex flex-col z-20 shadow-[5px_0_30px_rgba(13,31,92,0.03)] shrink-0 h-full">
        {/* Header */}
        <header className="px-6 py-5 flex items-center gap-4 bg-white shrink-0 z-30">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-[14px] bg-white border border-indigo-50 flex items-center justify-center text-[#0d1f5c] hover:bg-[#f8f9ff] hover:border-indigo-100 transition-all shadow-sm"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div
            style={{ fontFamily: '"Sora", sans-serif' }}
            className="font-extrabold text-[20px] tracking-tight text-[#0d1f5c]"
          >
            Plan Your Trip
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-white flex flex-col custom-scrollbar">
          {/* AILA CHAT UI */}
          <div className="px-6 pb-6 pt-2 shrink-0 border-b border-indigo-50/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 shrink-0 relative">
                <img
                  src={ailaMascot}
                  alt="Aila"
                  className="w-full h-full object-contain relative z-10"
                />
              </div>
              <div className="flex-1">
                {ailaMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-indigo-50 text-[#0d1f5c] text-[12px] font-bold p-3.5 rounded-[18px] shadow-sm leading-snug"
                  >
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Stack (Grouped at the top, empty space stays at the bottom naturally) */}
          <div className="px-6 pt-6 pb-12 flex flex-col gap-6">
            {/* Input Section */}
            <div className="space-y-3 relative">
              {/* Connecting Line */}
              <div className="absolute left-[24px] top-10 bottom-10 w-[2px] bg-indigo-50 z-0"></div>

              {/* Start Input */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-[0_0_0_3px_white]"></div>
                  </div>
                  <input
                    ref={originRef}
                    type="text"
                    placeholder="Starting Point"
                    className="w-full pl-12 pr-11 py-4 bg-white border border-indigo-100 rounded-[18px] text-[13px] font-bold text-[#0d1f5c] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:font-semibold placeholder:text-slate-400 shadow-sm"
                    value={originStr}
                    onChange={(e) => {
                      setOriginStr(e.target.value);
                      setOriginCoords(null);
                    }}
                  />
                  <button
                    onClick={() => handleCurrentLocation("origin")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600 transition-colors bg-white p-1.5 rounded-lg"
                  >
                    <Navigation size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <button
                  onClick={() =>
                    setPinMode(pinMode === "origin" ? null : "origin")
                  }
                  className={`w-12 h-12 shrink-0 rounded-[18px] border-2 transition-all flex items-center justify-center gap-2 active:scale-95 ${pinMode === "origin" ? "bg-indigo-600 border-indigo-600 text-white shadow-md font-black text-[9px] tracking-widest" : "bg-white border-indigo-50 text-indigo-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm"}`}
                >
                  {pinMode === "origin" ? "PICK" : <MapPin size={20} />}
                </button>
              </div>

              {/* Destination Input */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <div className="w-3.5 h-3.5 rounded-full border-[3px] border-indigo-200 bg-white"></div>
                  </div>
                  <input
                    ref={destRef}
                    type="text"
                    placeholder="Destination"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-indigo-100 rounded-[18px] text-[13px] font-bold text-[#0d1f5c] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:font-semibold placeholder:text-slate-400 shadow-sm"
                    value={destStr}
                    onChange={(e) => {
                      setDestStr(e.target.value);
                      setDestCoords(null);
                    }}
                  />
                </div>
                <button
                  onClick={() =>
                    setPinMode(pinMode === "destination" ? null : "destination")
                  }
                  className={`w-12 h-12 shrink-0 rounded-[18px] border-2 transition-all flex items-center justify-center gap-2 active:scale-95 ${pinMode === "destination" ? "bg-[#0d1f5c] border-[#0d1f5c] text-white shadow-md font-black text-[9px] tracking-widest" : "bg-white border-indigo-50 text-indigo-400 hover:text-[#0d1f5c] hover:border-indigo-100 shadow-sm"}`}
                >
                  {pinMode === "destination" ? (
                    "PICK"
                  ) : (
                    <LocateFixed size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Travel Mode Toggle */}
            <div className="bg-[#f8f9ff] p-1.5 rounded-[20px] border border-indigo-50 flex">
              <button
                onClick={() => setMode("transit")}
                className={`flex-1 py-3 px-4 rounded-[16px] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${mode === "transit" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-indigo-400"}`}
              >
                <Bus size={16} /> Transit
              </button>
              <button
                onClick={() => setMode("driving")}
                className={`flex-1 py-3 px-4 rounded-[16px] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${mode === "driving" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-indigo-400"}`}
              >
                <Car size={16} /> Driving
              </button>
            </div>

            {/* Passenger Type */}
            {mode === "transit" && (
              <div className="bg-white p-5 rounded-[20px] border border-indigo-50 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                  <UserSquare2 size={14} /> Passenger Type
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "regular", label: "Regular" },
                    { id: "student", label: "Student ID" },
                    { id: "senior", label: "Senior/PWD" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPassengerType(type.id)}
                      className={`py-3 px-3 rounded-[14px] border-2 text-[12px] font-extrabold transition-all flex items-center justify-center ${passengerType === type.id ? "bg-indigo-50/50 border-indigo-400 text-indigo-700" : "bg-white border-indigo-50 text-slate-500 hover:border-indigo-100 hover:bg-[#f8f9ff]"}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Action Button */}
            <button
              onClick={handleSearch}
              disabled={loading || !originStr || !destStr}
              className="w-full py-4.5 bg-[#828cb8] text-white text-[13px] font-black uppercase tracking-widest rounded-[20px] hover:bg-[#6c76a5] transition-all disabled:opacity-50 shadow-[0_8px_20px_rgba(130,140,184,0.3)] flex items-center justify-center gap-3 active:scale-[0.98] mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Search size={18} className="text-white/80" /> Find Best
                  Routes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── MIDDLE COLUMN: Map ── */}
      <div className="flex-1 min-h-[40vh] md:min-h-full relative z-0">
        <MapSection
          originCoords={originCoords}
          originStr={originStr}
          destCoords={destCoords}
          destStr={destStr}
          activeRoute={activeRoute}
          pinMode={pinMode}
          handleMapPin={handleMapPin}
          mode={mode}
        />
      </div>

      {/* ── RIGHT COLUMN: Route Options ── */}
      {routesData && (
        <RouteOptions
          routesData={routesData}
          selectedRouteIdx={selectedRouteIdx}
          setSelectedRouteIdx={setSelectedRouteIdx}
          mode={mode}
          handleStartJourney={handleStartJourney}
          handleSaveForLater={handleSaveForLater}
          saving={saving}
          saved={saved}
        />
      )}
    </div>
  );
}
