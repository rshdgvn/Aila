import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Popup, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import { reverseGeocode, originIcon, destIcon, stopIcon, getTransitColor } from "../config/utils";

function MapClickHandler({ pinMode, onPin }: { pinMode: "origin" | "destination" | null; onPin: (lat: number, lng: number, address: string) => void; }) {
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
      map.fitBounds(latLngBounds(routeCoords), { padding: [60, 60] });
  }, [routeCoords, map]);
  return null;
}

export default function MapSection({ originCoords, originStr, destCoords, destStr, activeRoute, pinMode, handleMapPin, mode }: any) {
  const allRouteCoords = activeRoute ? activeRoute.legs.flatMap((l: any) => l.path) : [];

  return (
    <div className="flex-1 relative z-0 h-[40vh] md:h-full bg-slate-100 border-r border-slate-200 shadow-inner">
      <MapContainer center={[14.5995, 120.9842]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }} zoomControl={false}>
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler pinMode={pinMode} onPin={handleMapPin} />
        {allRouteCoords.length > 0 && <MapFitter routeCoords={allRouteCoords} />}

        {originCoords && (
          <Marker position={originCoords} icon={originIcon}>
            <Popup className="rounded-xl border-0 shadow-lg font-sans">
              <div className="font-bold text-slate-900 mb-0.5">Origin</div>
              <div className="text-slate-500 text-xs">{originStr}</div>
            </Popup>
          </Marker>
        )}
        
        {destCoords && (
          <Marker position={destCoords} icon={destIcon}>
            <Popup className="rounded-xl border-0 shadow-lg font-sans">
              <div className="font-bold text-slate-900 mb-0.5">Destination</div>
              <div className="text-slate-500 text-xs">{destStr}</div>
            </Popup>
          </Marker>
        )}

        {activeRoute && activeRoute.legs && activeRoute.legs.map((leg: any, i: number) => {
          if (!leg.path || leg.path.length === 0) return null;
          const isWalking = leg.type === "WALKING";
          const lineColor = isWalking ? "#94a3b8" : (mode === "transit" ? getTransitColor(leg.vehicle_type) : "#4f46e5");
          
          return (
            <div key={i}>
              <Polyline
                positions={leg.path}
                color={lineColor}
                weight={isWalking ? 4 : 5}
                dashArray={isWalking ? "8, 8" : undefined}
                lineCap="round"
                lineJoin="round"
              />
              {leg.type === "TRANSIT" && leg.path.length > 1 && (
                <>
                  <Marker position={leg.path[0]} icon={stopIcon}>
                    <Popup className="font-sans font-bold text-xs">Boarding: {leg.departure_stop || "Station"}</Popup>
                  </Marker>
                  <Marker position={leg.path[leg.path.length - 1]} icon={stopIcon}>
                    <Popup className="font-sans font-bold text-xs">Alighting (Babaan): {leg.arrival_stop || "Station"}</Popup>
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