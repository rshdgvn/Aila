import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  Popup,
  useMap,
} from "react-leaflet";
import { latLngBounds } from "leaflet";
import {
  reverseGeocode,
  originIcon,
  destIcon,
  stopIcon,
  getTransitColor,
} from "../config/utils";

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
    if (routeCoords.length > 0) {
      const paddingParams: [number, number] =
        window.innerWidth < 768 ? [30, 30] : [60, 60];
      map.fitBounds(latLngBounds(routeCoords), { padding: paddingParams });
    }
  }, [routeCoords, map]);
  return null;
}

export default function MapSection({
  originCoords,
  originStr,
  destCoords,
  destStr,
  activeRoute,
  pinMode,
  handleMapPin,
  mode,
}: any) {
  const allRouteCoords = activeRoute
    ? activeRoute.legs.flatMap((l: any) => l.path)
    : [];

  return (
    <div className="flex-1 relative z-0 h-full w-full bg-[#e2e8f0]">
      {pinMode && (
        <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[400] bg-[#0d1f5c] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-2xl font-bold text-[11px] sm:text-[12px] uppercase tracking-widest flex items-center gap-2 border border-indigo-400/30 animate-bounce whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
          Tap anywhere to set {pinMode}
        </div>
      )}

      <MapContainer
        center={[14.5995, 120.9842]}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap"
        />
        <MapClickHandler pinMode={pinMode} onPin={handleMapPin} />
        {allRouteCoords.length > 0 && (
          <MapFitter routeCoords={allRouteCoords} />
        )}

        {originCoords && (
          <Marker position={originCoords} icon={originIcon}>
            <Popup className="rounded-2xl border-0 shadow-xl font-sans">
              <div className="font-black text-indigo-600 mb-0.5 uppercase tracking-widest text-[9px]">
                Origin
              </div>
              <div
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-[#0d1f5c] font-bold text-[12px] leading-tight"
              >
                {originStr.split(",")[0]}
              </div>
            </Popup>
          </Marker>
        )}

        {destCoords && (
          <Marker position={destCoords} icon={destIcon}>
            <Popup className="rounded-2xl border-0 shadow-xl font-sans">
              <div className="font-black text-rose-600 mb-0.5 uppercase tracking-widest text-[9px]">
                Destination
              </div>
              <div
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-[#0d1f5c] font-bold text-[12px] leading-tight"
              >
                {destStr.split(",")[0]}
              </div>
            </Popup>
          </Marker>
        )}

        {activeRoute &&
          activeRoute.legs &&
          activeRoute.legs.map((leg: any, i: number) => {
            if (!leg.path || leg.path.length === 0) return null;
            const isWalking = leg.type === "WALKING";
            const lineColor = isWalking
              ? "#94a3b8"
              : mode === "transit"
                ? getTransitColor(leg.vehicle_type)
                : "#4f46e5";

            return (
              <div key={i}>
                <Polyline
                  positions={leg.path}
                  color={lineColor}
                  weight={isWalking ? 5 : 6}
                  dashArray={isWalking ? "8, 10" : undefined}
                  lineCap="round"
                  lineJoin="round"
                  className={
                    !isWalking
                      ? "drop-shadow-[0_2px_4px_rgba(79,70,229,0.3)]"
                      : ""
                  }
                />
                {leg.type === "TRANSIT" && leg.path.length > 1 && (
                  <>
                    <Marker position={leg.path[0]} icon={stopIcon}>
                      <Popup className="font-sans">
                        <div className="font-black text-indigo-500 uppercase tracking-widest text-[8px] mb-0.5">
                          Boarding
                        </div>
                        <div className="font-bold text-[#0d1f5c] text-[11px] leading-tight">
                          {leg.departure_stop || "Station"}
                        </div>
                      </Popup>
                    </Marker>
                    <Marker
                      position={leg.path[leg.path.length - 1]}
                      icon={stopIcon}
                    >
                      <Popup className="font-sans">
                        <div className="font-black text-rose-500 uppercase tracking-widest text-[8px] mb-0.5">
                          Alighting
                        </div>
                        <div className="font-bold text-[#0d1f5c] text-[11px] leading-tight">
                          {leg.arrival_stop || "Station"}
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </div>
            );
          })}
      </MapContainer>
    </div>
  );
}
