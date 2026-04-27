import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Compass,
  Search,
  Trash2,
  Navigation,
  Menu,
} from "lucide-react";
import { placesApi } from "../config/api";
import { loadGoogleMaps, reverseGeocode } from "../config/utils";
import Sidebar from "../components/Sidebar";

interface SavedPlace {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const customPinIcon = L.divIcon({
  className: "custom-pin",
  html: `<div class="w-8 h-8 bg-[#0d1f5c] rounded-full border-[3px] border-white shadow-lg flex items-center justify-center"><div class="w-2.5 h-2.5 bg-white rounded-full"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapClickHandler({
  onPin,
}: {
  onPin: (lat: number, lng: number, address: string) => void;
}) {
  useMapEvents({
    async click(e) {
      const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      onPin(e.latlng.lat, e.latlng.lng, address);
    },
  });
  return null;
}

export default function SavedPlaces() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCoords, setNewCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const addressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (isAdding) {
      loadGoogleMaps()
        .then(() => {
          const google = (window as any).google;
          if (!addressRef.current) return;
          const autocomplete = new google.maps.places.Autocomplete(
            addressRef.current,
            { componentRestrictions: { country: "ph" } },
          );
          autocomplete.addListener("place_changed", () => {
            const p = autocomplete.getPlace();
            setNewAddress(
              p.name
                ? `${p.name}, ${p.formatted_address}`
                : p.formatted_address || "",
            );
            if (p.geometry?.location) {
              setNewCoords({
                lat: p.geometry.location.lat(),
                lng: p.geometry.location.lng(),
              });
            }
          });
        })
        .catch(console.error);
    }
  }, [isAdding]);

  const fetchPlaces = async () => {
    try {
      const res = await placesApi.getAll();
      setPlaces(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMapPin = (lat: number, lng: number, address: string) => {
    setNewCoords({ lat, lng });
    setNewAddress(address);
  };

  const handleAddPlace = async () => {
    if (!newName || !newAddress || !newCoords) return;
    try {
      await placesApi.create({
        name: newName,
        address: newAddress,
        lat: newCoords.lat,
        lng: newCoords.lng,
      });
      setIsAdding(false);
      setNewName("");
      setNewAddress("");
      setNewCoords(null);
      fetchPlaces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await placesApi.delete(id);
      fetchPlaces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTravel = (place: SavedPlace) => {
    navigate("/new-travel", {
      state: {
        destStr: place.address,
        destCoords: [place.lat, place.lng],
      },
    });
  };

  const renderHeader = (isMobile: boolean) => (
    <div
      className={`${
        isMobile ? "md:hidden flex" : "hidden md:flex"
      } items-center justify-between bg-white px-6 py-5 border-b border-indigo-100 z-30 ${
        !isMobile ? "sticky top-0" : ""
      } shrink-0 ${isMobile ? "order-1" : ""} min-h-[82px]`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-[#f8f9ff] text-[#0d1f5c] rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1
          style={{ fontFamily: '"Sora", sans-serif' }}
          className="text-xl font-black text-[#0d1f5c]"
        >
          My Places
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="h-10 flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 rounded-xl font-bold hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <Plus size={16} strokeWidth={3} /> Add
          </button>
        ) : (
          <div className="h-10 w-0"></div>
        )}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl"
        >
          <Menu size={22} />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="h-[100svh] w-full bg-[#f4f7ff] flex flex-col md:flex-row text-[#0d1f5c]"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      <Sidebar
        activeTab="saved"
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {renderHeader(true)}

        <div className="flex-1 flex flex-col bg-[#f4f7ff] overflow-y-auto custom-scrollbar shadow-inner z-10 border-r border-indigo-50 order-3 md:order-1">
          {renderHeader(false)}

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {places?.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center opacity-60 bg-white rounded-[2rem] border border-indigo-50 border-dashed shadow-sm">
                  <MapPin size={48} className="text-indigo-200 mb-4" />
                  <p className="text-base font-bold text-[#0d1f5c]">
                    No saved places yet.
                  </p>
                </div>
              ) : (
                places?.map((place) => (
                  <div
                    key={place.id}
                    className="bg-white p-5 rounded-[1.5rem] border border-indigo-50 shadow-[0_4px_20px_rgba(13,31,92,0.04)] flex items-center gap-4 group hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer"
                  >
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#f8f9ff] text-indigo-600 flex items-center justify-center border border-indigo-50">
                      <MapPin size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        style={{ fontFamily: '"Sora", sans-serif' }}
                        className="font-extrabold text-lg text-[#0d1f5c] truncate leading-tight"
                      >
                        {place.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mt-1 truncate">
                        {place.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTravel(place);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors shadow-sm"
                      >
                        <Navigation size={18} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(place.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col bg-white shrink-0 z-0 h-[55vh] md:h-full relative order-2 md:order-2">
          <div className="h-2/3 md:h-1/2 relative">
            <MapContainer
              center={[14.5995, 120.9842]}
              zoom={13}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              {isAdding && <MapClickHandler onPin={handleMapPin} />}

              {isAdding && newCoords && (
                <Marker
                  position={[newCoords.lat, newCoords.lng]}
                  icon={customPinIcon}
                />
              )}

              {!isAdding &&
                places?.map((place) => (
                  <Marker
                    key={place.id}
                    position={[place.lat, place.lng]}
                    icon={customPinIcon}
                  />
                ))}
            </MapContainer>

            {isAdding && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-indigo-50 z-10 pointer-events-none whitespace-nowrap">
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                  Tap map to pick location
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 bg-white p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] z-20 flex flex-col">
            {isAdding ? (
              <div className="flex flex-col h-full space-y-5">
                <h2
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-xl font-black text-[#0d1f5c]"
                >
                  Save New Place
                </h2>

                <div className="space-y-4 flex-1">
                  <div className="relative">
                    <div className="absolute top-[18px] left-4 flex items-center pointer-events-none">
                      <Search size={18} className="text-indigo-400" />
                    </div>
                    <input
                      ref={addressRef}
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-[#f8f9ff] border border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl text-[13px] font-bold text-[#0d1f5c] outline-none transition-all shadow-inner"
                      placeholder="Search or tap on map"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-5 py-4 bg-[#f8f9ff] border border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl text-[13px] font-bold text-[#0d1f5c] outline-none transition-all shadow-inner"
                      placeholder="Name (e.g. Home, Office)"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2 mt-auto">
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewCoords(null);
                      setNewAddress("");
                      setNewName("");
                    }}
                    className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPlace}
                    disabled={!newName || !newAddress || !newCoords}
                    className="flex-[2] py-4 bg-[#0d1f5c] text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50"
                  >
                    Save Place
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <Compass size={40} className="text-indigo-200 mb-3" />
                <p className="text-sm font-bold text-[#0d1f5c]">
                  Select a place to view or click Add to map a new spot.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c7d2fe; }
        .custom-pin { overflow: visible !important; }
      `}</style>
    </div>
  );
}
