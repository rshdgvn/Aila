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
  Sparkles,
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
        "Give me a second, I'm scanning the map and checking the latest LFTRB fares...",
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
      else if (selected?.insights?.includes("Most Comfortable"))
        msg += "This is the most comfortable and direct path I could find. ";
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

  // Get Current Geolocation Feature
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

      // Filter out duplicate routes
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

  const handleStartJourney = async () => {
    if (selectedRouteIdx === null || !routesData) return;
    const route = routesData.routes[selectedRouteIdx];
    setSaving(true);
    try {
      const res = await tripsApi.create({
        origin: originStr,
        destination: destStr,
        mode: mode,
        distance_km: Number(route.total_distance_km.toFixed(2)),
        duration_mins: Math.round(route.total_duration_mins),
        total_fare: route.grand_total_fare || 0,
        status: "active",
      });
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
      await tripsApi.create({
        origin: originStr,
        destination: destStr,
        mode: mode,
        distance_km: Number(route.total_distance_km.toFixed(2)),
        duration_mins: Math.round(route.total_duration_mins),
        total_fare: route.grand_total_fare || 0,
        status: "pending",
      });
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
      className="h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      {/* LEFT COLUMN: Aila & Inputs */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl shrink-0 h-full overflow-hidden">
        <header className="px-6 py-5 flex items-center gap-4 border-b border-slate-100 bg-white sticky top-0 z-30">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:scale-105"
          >
            <ArrowLeft size={20} />
          </button>
          <div
            style={{ fontFamily: '"Sora", sans-serif' }}
            className="font-extrabold text-xl tracking-tight text-[#0d1f5c]"
          >
            Plan Your Trip
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col">
          {/* STATIC AILA CHAT UI */}
          <div className="p-6 bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-5">
              <div className="w-32 h-32 md:w-36 md:h-36 shrink-0 relative">
                <div className="absolute inset-0 bg-indigo-50 rounded-full blur-2xl pointer-events-none"></div>
                <img
                  src={ailaMascot}
                  alt="Aila Mascot"
                  className="w-full h-full object-contain relative z-10"
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {ailaMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-100 text-[#0d1f5c] text-sm font-semibold p-4 rounded-[24px] rounded-bl-sm shadow-sm leading-relaxed"
                  >
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-6 flex-1 space-y-8">
            {/* Input Section */}
            <div className="space-y-4 relative">
              <div className="absolute left-[29px] top-10 bottom-10 w-0.5 bg-slate-200/60 z-0"></div>

              {/* Start Input */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-colors ${originCoords ? "bg-indigo-600" : "bg-slate-300"}`}
                    ></div>
                  </div>
                  <input
                    ref={originRef}
                    type="text"
                    placeholder="Starting Point"
                    className="w-full pl-12 pr-12 py-4.5 bg-slate-50 border border-slate-200 rounded-[20px] text-sm font-bold text-[#0d1f5c] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:font-medium placeholder:text-slate-400"
                    value={originStr}
                    onChange={(e) => {
                      setOriginStr(e.target.value);
                      setOriginCoords(null);
                    }}
                  />
                  {/* Locate Me Button (Only on Origin) */}
                  <button
                    onClick={() => handleCurrentLocation("origin")}
                    title="Use current location"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <Navigation size={18} />
                  </button>
                </div>
                <button
                  onClick={() =>
                    setPinMode(pinMode === "origin" ? null : "origin")
                  }
                  className={`w-14 h-14 shrink-0 rounded-[20px] border transition-all flex items-center justify-center gap-2 active:scale-95 ${pinMode === "origin" ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black text-xs" : "bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm"}`}
                >
                  {pinMode === "origin" ? "PICK" : <MapPin size={22} />}
                </button>
              </div>

              {/* Destination Input */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-colors ${destCoords ? "bg-[#0d1f5c]" : "bg-slate-300"}`}
                    ></div>
                  </div>
                  <input
                    ref={destRef}
                    type="text"
                    placeholder="Destination"
                    className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border border-slate-200 rounded-[20px] text-sm font-bold text-[#0d1f5c] focus:bg-white focus:border-[#0d1f5c] focus:ring-4 focus:ring-indigo-50 transition-all placeholder:font-medium placeholder:text-slate-400"
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
                  className={`w-14 h-14 shrink-0 rounded-[20px] border transition-all flex items-center justify-center gap-2 active:scale-95 ${pinMode === "destination" ? "bg-[#0d1f5c] border-[#0d1f5c] text-white shadow-lg shadow-indigo-900/30 font-black text-xs" : "bg-white border-slate-200 text-slate-400 hover:text-[#0d1f5c] hover:border-indigo-200 shadow-sm"}`}
                >
                  {pinMode === "destination" ? (
                    "PICK"
                  ) : (
                    <LocateFixed size={22} />
                  )}
                </button>
              </div>
            </div>

            {/* Travel Mode & Calculate */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex">
                <button
                  onClick={() => setMode("transit")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${mode === "transit" ? "bg-white text-indigo-700 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Bus size={18} /> Transit
                </button>
                <button
                  onClick={() => setMode("driving")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${mode === "driving" ? "bg-white text-indigo-700 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Car size={18} /> Driving
                </button>
              </div>

              {mode === "transit" && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <UserSquare2 size={16} className="text-indigo-400" />{" "}
                    Passenger ID Configuration
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "regular", label: "Regular" },
                      { id: "student", label: "Student ID" },
                      { id: "senior", label: "Senior/PWD" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setPassengerType(type.id)}
                        className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center ${passengerType === type.id ? "bg-indigo-50 border-indigo-200 text-[#0d1f5c] shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50"}`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={loading || !originStr || !destStr}
                className="w-full py-4.5 bg-[#0d1f5c] text-white text-sm font-extrabold rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    <Sparkles size={19} /> Calculate Trip Options
                  </>
                )}
              </button>
            </div>

            <div className="w-20 h-0.5 bg-slate-100 mx-auto rounded-full mt-4"></div>
          </div>
        </div>
      </div>

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

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .custom-pin { overflow: visible !important; }`}</style>
    </div>
  );
}
