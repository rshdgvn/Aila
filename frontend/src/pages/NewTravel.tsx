import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Car,
  Bus,
  Loader2,
  CheckCircle2,
  Footprints,
  Train,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { routesApi, tripsApi } from "../config/api";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }
    if (document.querySelector("script[data-gm]")) {
      const t = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(t);
          resolve();
        }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.setAttribute("data-gm", "1");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`,
    );
    const d = await r.json();
    if (d.status === "OK" && d.results.length > 0) {
      for (const res of d.results) {
        if (
          (res.types || []).some((t: string) =>
            ["locality", "sublocality", "neighborhood", "route"].includes(t),
          )
        ) {
          return res.formatted_address;
        }
      }
      return d.results[0].formatted_address;
    }
  } catch (e) {}
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function MapClickHandler({
  pinMode,
  onPin,
}: {
  pinMode: "origin" | "destination" | null;
  onPin: (lat: number, lng: number, address: string) => void;
}) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = pinMode ? "crosshair" : "";
  }, [pinMode, map]);
  useMapEvents({
    async click(e) {
      if (!pinMode) return;
      const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      onPin(e.latlng.lat, e.latlng.lng, address);
    },
  });
  return null;
}

function MapFitter({ routeCoords }: { routeCoords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (routeCoords.length > 0)
      map.fitBounds(L.latLngBounds(routeCoords), { padding: [40, 40] });
  }, [routeCoords, map]);
  return null;
}

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

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
  const [loading, setLoading] = useState(false);
  const [routesData, setRoutesData] = useState<any>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      const data = await routesApi.getRoutes(o, d, mode);
      const parsedRoutes = data.routes?.map((route: any) => ({
        ...route,
        legs: route.legs.map((leg: any) => ({
          ...leg,
          path: leg.geometry
            ? polyline.decode(leg.geometry).map((p) => [p[0], p[1]])
            : [],
        })),
      }));
      setRoutesData({ ...data, routes: parsedRoutes });
      if (parsedRoutes && parsedRoutes.length > 0) setSelectedRouteIdx(0);
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

  const activeRoute =
    selectedRouteIdx !== null && routesData
      ? routesData.routes[selectedRouteIdx]
      : null;
  const allRouteCoords = activeRoute
    ? activeRoute.legs.flatMap((l: any) => l.path)
    : [];

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-slate-400 hover:text-slate-900 transition-colors p-2"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="font-black text-lg tracking-tight uppercase">
          Plan Your Journey
        </div>
        <div className="w-10"></div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:row relative">
        <div className="w-full md:w-[480px] bg-white border-r border-slate-200 flex flex-col shadow-2xl z-20 shrink-0 h-full overflow-hidden">
          <div className="p-8 flex-1 overflow-y-auto space-y-8">
            <div className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                  <img
                    src="/aila-reading-map.png"
                    className="w-10 h-10 object-contain animate-aila-float"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-1 opacity-80">
                    Aila Guide
                  </h3>
                  <p className="text-[15px] font-medium leading-relaxed italic">
                    "
                    {routesData?.aila_tip ||
                      "Drop pins on the map or type your destination. I'll handle the rest!"}
                    "
                  </p>
                </div>
              </div>
              <Sparkles className="absolute -right-4 -top-4 w-24 h-24 opacity-10 rotate-12" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-[6px] ring-indigo-50"></div>
                  </div>
                  <input
                    ref={originRef}
                    type="text"
                    placeholder="Starting Point"
                    className="w-full pl-14 pr-4 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-indigo-600 focus:ring-0 transition-all shadow-inner"
                    value={originStr}
                    onChange={(e) => {
                      setOriginStr(e.target.value);
                      setOriginCoords(null);
                    }}
                  />
                </div>
                <button
                  onClick={() =>
                    setPinMode(pinMode === "origin" ? null : "origin")
                  }
                  className={`p-5 rounded-[22px] border-2 transition-all ${pinMode === "origin" ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm"}`}
                >
                  <MapPin size={22} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-[6px] ring-rose-50"></div>
                  </div>
                  <input
                    ref={destRef}
                    type="text"
                    placeholder="Destination"
                    className="w-full pl-14 pr-4 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-indigo-600 focus:ring-0 transition-all shadow-inner"
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
                  className={`p-5 rounded-[22px] border-2 transition-all ${pinMode === "destination" ? "bg-rose-500 border-rose-500 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:text-rose-500 shadow-sm"}`}
                >
                  <Navigation size={22} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 bg-slate-100 p-1.5 rounded-[28px]">
              <button
                onClick={() => setMode("transit")}
                className={`flex-1 py-4 px-4 rounded-[22px] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === "transit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/50"}`}
              >
                <Bus size={18} /> Transit
              </button>
              <button
                onClick={() => setMode("driving")}
                className={`flex-1 py-4 px-4 rounded-[22px] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === "driving" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/50"}`}
              >
                <Car size={18} /> Driving
              </button>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading || !originStr || !destStr}
              className="w-full py-5 bg-slate-950 text-white text-sm font-black uppercase tracking-[0.2em] rounded-[24px] hover:bg-indigo-600 transition-all disabled:opacity-30 shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                "Calculate Route"
              )}
            </button>

            {routesData?.routes?.map((route: any, i: number) => {
              const isSelected = selectedRouteIdx === i;
              return (
                <div
                  key={i}
                  className={`rounded-[32px] transition-all border-2 overflow-hidden ${isSelected ? "border-indigo-600 bg-white shadow-2xl" : "border-slate-100 bg-white hover:border-slate-200"}`}
                >
                  <div
                    onClick={() => setSelectedRouteIdx(i)}
                    className="p-6 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-black text-slate-900 text-lg mb-2">
                        {route.summary || "Best Route"}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black">
                          {route.total_distance_km.toFixed(1)} KM
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">
                          {Math.round(route.total_duration_mins)} MINS
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      size={24}
                      className={`text-slate-300 transition-transform ${isSelected ? "rotate-180 text-indigo-600" : ""}`}
                    />
                  </div>
                  {isSelected && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30">
                      <div className="space-y-4 mb-8">
                        {route.legs.map((leg: any, idx: number) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                {leg.type === "WALKING" ? (
                                  <Footprints size={14} />
                                ) : leg.type === "TRANSIT" ? (
                                  <Train size={14} />
                                ) : (
                                  <Car size={14} />
                                )}
                              </div>
                              {idx !== route.legs.length - 1 && (
                                <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>
                              )}
                            </div>
                            <p className="text-sm font-bold text-slate-700 pt-1.5">
                              {stripHtml(leg.instructions)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleStartJourney}
                        disabled={saving || saved}
                        className={`w-full py-5 text-white text-xs font-black uppercase tracking-widest rounded-[22px] shadow-lg flex items-center justify-center gap-2 transition-all ${saved ? "bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-700"}`}
                      >
                        {saving ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : saved ? (
                          <>
                            <CheckCircle2 size={20} /> Starting...
                          </>
                        ) : (
                          "Start Live Tracking"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Map */}
        <div className="flex-1 relative z-0 h-full min-h-[500px] bg-slate-100">
          <MapContainer
            center={[14.5995, 120.9842]}
            zoom={13}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapClickHandler pinMode={pinMode} onPin={handleMapPin} />
            {allRouteCoords.length > 0 && (
              <MapFitter routeCoords={allRouteCoords} />
            )}

            {originCoords && (
              <Marker position={originCoords}>
                <Popup className="rounded-xl border-0 shadow-lg">
                  <div className="font-semibold text-slate-900 mb-1">
                    Origin
                  </div>
                  <div className="text-slate-500 text-xs">{originStr}</div>
                </Popup>
              </Marker>
            )}
            {destCoords && (
              <Marker position={destCoords}>
                <Popup className="rounded-xl border-0 shadow-lg">
                  <div className="font-semibold text-slate-900 mb-1">
                    Destination
                  </div>
                  <div className="text-slate-500 text-xs">{destStr}</div>
                </Popup>
              </Marker>
            )}

            {activeRoute &&
              activeRoute.legs &&
              activeRoute.legs.map((leg: any, i: number) => {
                if (!leg.path || leg.path.length === 0) return null;
                const isWalking = leg.type === "WALKING";
                return (
                  <Polyline
                    key={i}
                    positions={leg.path}
                    color={isWalking ? "#94a3b8" : "#4f46e5"}
                    weight={isWalking ? 4 : 5}
                    dashArray={isWalking ? "8, 8" : undefined}
                    lineCap="round"
                    lineJoin="round"
                  />
                );
              })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
