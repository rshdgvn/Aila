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
        "Wait lang, buddy! Checking the map for the best routes...",
      ]);
      return;
    }

    if (routesData && routesData.routes?.length > 0) {
      setAilaMascot("/aila-celebrating.png");
      setAilaMessages([
        `Found ${routesData.routes.length} solid options! Pick the best one for you.`,
      ]);
      return;
    }

    setAilaMascot("/aila-relax.png");
    if (pinMode) {
      setAilaMessages([`Tap anywhere on the map to drop your ${pinMode} pin!`]);
    } else if (!originCoords && !destCoords) {
      setAilaMessages(["Kamusta! Where are we heading today?"]);
    } else {
      setAilaMessages(["Got it! Now, let's set your destination."]);
    }
  }, [
    loading,
    routesData,
    selectedRouteIdx,
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
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
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
    });
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
    try {
      const data = await routesApi.getRoutes(o, d, mode, passengerType);

      const rawRoutes = data.routes || [];
      const uniqueRoutes = rawRoutes.filter(
        (route: any, index: number, self: any[]) =>
          index ===
          self.findIndex(
            (r: any) =>
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
      <div className="w-full md:w-[420px] bg-[#f8f9ff] flex flex-col z-20 shadow-2xl shrink-0 h-full overflow-hidden border-r border-indigo-100">
        <header className="px-6 py-5 flex items-center gap-4 bg-white shadow-sm shrink-0 z-30">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-[#0d1f5c] hover:bg-indigo-100 transition-all"
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

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-5 pb-2 shrink-0 flex items-end gap-1">
            <div className="w-36 h-36 md:w-44 md:h-44 shrink-0 relative flex items-end">
              <img
                src={ailaMascot}
                alt="Aila"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(13,31,92,0.15)] scale-[1.15] origin-bottom"
              />
            </div>

            <div className="flex-1 mb-8 relative">
              <div className="absolute -left-2 bottom-4 w-4 h-4 bg-white border-l border-b border-indigo-100 transform rotate-45 z-0"></div>
              <div className="relative bg-white border border-indigo-100 shadow-[0_10px_30px_rgba(13,31,92,0.08)] rounded-2xl rounded-bl-none p-4 z-10">
                <p className="text-[#0d1f5c] font-bold text-[13px] leading-snug">
                  {ailaMessages[0]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 pb-6 pt-2 flex flex-col gap-4 overflow-hidden">
            <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgba(13,31,92,0.04)] border border-indigo-50 space-y-3 relative">
              <div className="absolute left-[30px] top-10 bottom-10 w-[2px] bg-indigo-50 z-0"></div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_0_4px_white]"></div>
                  </div>
                  <input
                    ref={originRef}
                    type="text"
                    placeholder="Starting Point"
                    className="w-full pl-11 pr-10 py-3.5 bg-[#f8f9ff] border border-transparent rounded-2xl text-[13px] font-bold text-[#0d1f5c] focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                    value={originStr}
                    onChange={(e) => {
                      setOriginStr(e.target.value);
                      setOriginCoords(null);
                    }}
                  />
                  <button
                    onClick={() => handleCurrentLocation("origin")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
                  >
                    <Navigation size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <button
                  onClick={() =>
                    setPinMode(pinMode === "origin" ? null : "origin")
                  }
                  className={`w-12 h-12 shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all ${pinMode === "origin" ? "bg-[#0d1f5c] text-white border-[#0d1f5c]" : "bg-white border-indigo-50 text-indigo-400 hover:text-indigo-600 shadow-sm"}`}
                >
                  <MapPin size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0d1f5c] shadow-[0_0_0_4px_white]"></div>
                  </div>
                  <input
                    ref={destRef}
                    type="text"
                    placeholder="Destination"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#f8f9ff] border border-transparent rounded-2xl text-[13px] font-bold text-[#0d1f5c] focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
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
                  className={`w-12 h-12 shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all ${pinMode === "destination" ? "bg-[#0d1f5c] text-white border-[#0d1f5c]" : "bg-white border-indigo-50 text-indigo-400 hover:text-[#0d1f5c] shadow-sm"}`}
                >
                  <LocateFixed size={20} />
                </button>
              </div>
            </div>

            <div className="bg-white p-1.5 rounded-[20px] flex shadow-[0_4px_20px_rgba(13,31,92,0.04)] border border-indigo-50 shrink-0">
              <button
                onClick={() => setMode("transit")}
                className={`flex-1 py-3 rounded-[16px] text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${mode === "transit" ? "bg-[#0d1f5c] text-white shadow-md" : "text-slate-400 hover:text-[#0d1f5c]"}`}
              >
                <Bus size={16} /> Transit
              </button>
              <button
                onClick={() => setMode("driving")}
                className={`flex-1 py-3 rounded-[16px] text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${mode === "driving" ? "bg-[#0d1f5c] text-white shadow-md" : "text-slate-400 hover:text-[#0d1f5c]"}`}
              >
                <Car size={16} /> Driving
              </button>
            </div>

            {mode === "transit" && (
              <div className="bg-white p-4 rounded-[20px] shadow-[0_4px_20px_rgba(13,31,92,0.04)] border border-indigo-50 shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2.5 ml-1">
                  Passenger Type
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "regular", label: "Regular" },
                    { id: "student", label: "Student" },
                    { id: "senior", label: "Senior" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPassengerType(type.id)}
                      className={`py-2.5 px-1 rounded-xl border-2 text-[11px] font-extrabold transition-all ${passengerType === type.id ? "bg-indigo-50 border-indigo-400 text-[#0d1f5c]" : "bg-white border-indigo-50 text-slate-400 hover:border-indigo-100"}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 min-h-[10px]"></div>

            <button
              onClick={handleSearch}
              disabled={loading || !originStr || !destStr}
              className="w-full py-4.5 bg-indigo-600 text-white text-[14px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-[0_10px_25px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] shrink-0 disabled:opacity-70 disabled:hover:bg-indigo-500"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Search size={18} strokeWidth={3} /> Find Best Routes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

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

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
