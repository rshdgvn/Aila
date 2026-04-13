import L from "leaflet";

export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export const originIcon = L.divIcon({
  className: "custom-pin",
  html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-[3px] border-white shadow-md"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const destIcon = L.divIcon({
  className: "custom-pin",
  html: `<div class="w-6 h-6 bg-[#0d1f5c] rounded-full border-[3px] border-white shadow-md"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const stopIcon = L.divIcon({
  className: "custom-pin",
  html: `<div class="w-3.5 h-3.5 bg-white rounded-full border-[3px] border-indigo-600 shadow-sm"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export function loadGoogleMaps(): Promise<void> {
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

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
    );
    const d = await r.json();
    if (d.status === "OK" && d.results.length > 0) {
      for (const res of d.results) {
        if (
          (res.types || []).some((t: string) =>
            ["locality", "sublocality", "neighborhood", "route"].includes(t)
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

export const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

export const getTransitColor = (vehicleType: string) => {
  if (!vehicleType) return "#4f46e5"; 
  const v = vehicleType.toUpperCase();
  if (v.includes("BUS")) return "#10b981"; 
  if (v.includes("RAIL") || v.includes("SUBWAY") || v.includes("TRAM")) return "#8b5cf6"; 
  if (v.includes("SHARE_TAXI") || v.includes("JEEPNEY")) return "#f59e0b"; 
  return "#4f46e5";
};