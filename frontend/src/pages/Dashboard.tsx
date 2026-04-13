import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Trip, tripsApi } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import {
  Plus,
  Navigation2,
  Calendar,
  Route,
  Map as MapIcon,
  ChevronRight,
  Activity,
  Car,
  Bus,
  Menu,
  X,
  Share2,
  Download,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    if (!document.getElementById("raleway-sora-font")) {
      const link = document.createElement("link");
      link.id = "raleway-sora-font";
      link.href =
        "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800;900&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    const date = new Date();
    const hour = date.getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setCurrentDate(
      date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );

    tripsApi
      .getAll()
      .then((r) => {
        const sortedTrips = r.data.sort(
          (a: Trip, b: Trip) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        );
        setTrips(sortedTrips);
      })
      .catch(console.error);
  }, []);

  const totalDistance = trips.reduce(
    (acc, trip) => acc + (trip.distance_km || 0),
    0,
  );
  const totalTrips = trips.length;

  const getOverviewText = () => {
    if (totalTrips === 0)
      return "Welcome aboard! Let's map out something exciting today.";
    if (totalDistance > 100)
      return `You've covered a massive ${totalDistance.toFixed(1)}km so far! Your travel history is highly active.`;
    if (trips.length > 0 && trips[0].status === "active")
      return "You have an ongoing trip! Tap play to return to navigation.";
    return `You have ${totalTrips} trips logged safely in your vault. Ready for a new route?`;
  };

  const formatLocationName = (address: string) => {
    if (!address) return "Unknown";
    return address.split(",")[0].trim();
  };

  return (
    <div
      className="h-screen w-full bg-[#f4f7ff] flex overflow-hidden text-[#0d1f5c]"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      <Sidebar
        activeTab="dashboard"
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="md:hidden flex items-center justify-between bg-white/80 backdrop-blur-md px-6 py-4 border-b border-indigo-100 z-30 sticky top-0">
          <span
            style={{ fontFamily: '"Sora", sans-serif' }}
            className="text-xl font-black text-[#0d1f5c]"
          >
            Aila.
          </span>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-2 mb-2 tracking-wider">
                  <Calendar size={14} /> {currentDate}
                </p>
                <h1
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-4xl md:text-5xl font-black text-[#0d1f5c] leading-tight tracking-tight"
                >
                  {greeting},<br />
                  {user?.firstName}!
                </h1>
              </div>
              <button
                onClick={() => navigate("/new-travel")}
                className="group flex items-center justify-center gap-2 bg-[#0d1f5c] text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-900/20 transition-all active:scale-95"
              >
                <Plus
                  size={20}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
                Map New Trip
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#0d1f5c] to-indigo-900 rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex items-center shadow-2xl shadow-indigo-900/15 border border-indigo-500/20 min-h-[280px]">
                <div className="absolute -top-32 -right-20 w-80 h-80 bg-indigo-500 blur-[80px] opacity-40 rounded-full mix-blend-screen pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500 blur-[80px] opacity-30 rounded-full mix-blend-screen pointer-events-none"></div>

                <div className="relative z-10 flex flex-col-reverse md:flex-row gap-8 items-center w-full justify-between h-full">
                  <div className="flex-1 text-white z-10">
                    <p
                      style={{ fontFamily: '"Sora", sans-serif' }}
                      className="text-xl md:text-3xl font-bold leading-snug mb-6 text-white/95 drop-shadow-md"
                    >
                      "{getOverviewText()}"
                    </p>
                  </div>

                  <div className="w-64 h-64 md:w-80 md:h-80 shrink-0 relative z-20 flex items-end justify-center -mr-4 md:-mr-8">
                    <img
                      src="/aila-relax.png"
                      alt="Aila"
                      className="w-full h-full object-contain origin-bottom scale-[1.7] md:scale-[1.8]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-indigo-50 flex flex-col justify-center gap-4 shadow-xl shadow-indigo-100/40">
                <div className="flex justify-between items-center bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff] p-5 rounded-[1.5rem] border border-indigo-100/50 hover:border-indigo-200 transition-colors">
                  <div>
                    <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mb-1">
                      Total Distance
                    </p>
                    <p
                      style={{ fontFamily: '"Sora", sans-serif' }}
                      className="text-3xl font-black text-[#0d1f5c] drop-shadow-sm"
                    >
                      {totalDistance.toFixed(1)}
                      <span className="text-base text-indigo-400 ml-1 font-bold">
                        km
                      </span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                    <Route size={24} />
                  </div>
                </div>
                <div className="flex justify-between items-center bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff] p-5 rounded-[1.5rem] border border-indigo-100/50 hover:border-indigo-200 transition-colors">
                  <div>
                    <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest mb-1">
                      Trips Logged
                    </p>
                    <p
                      style={{ fontFamily: '"Sora", sans-serif' }}
                      className="text-3xl font-black text-[#0d1f5c] drop-shadow-sm"
                    >
                      {totalTrips}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                    <Navigation2 size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-indigo-50 flex flex-col h-[450px] shadow-xl shadow-indigo-100/40">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-xl font-black text-[#0d1f5c] flex items-center gap-3"
                >
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                    <Activity size={20} />
                  </div>
                  Trip History
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {trips.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <MapIcon size={48} className="text-indigo-200 mb-4" />
                    <p className="text-base font-bold text-[#0d1f5c]">
                      No routes yet. Map your first Trip!
                    </p>
                  </div>
                ) : (
                  trips.map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() =>
                        navigate(`/trip/${trip.id}`, { state: { trip } })
                      }
                      className="cursor-pointer group flex items-center justify-between p-4 bg-white hover:bg-[#f8f9ff] rounded-[1.5rem] border-2 border-slate-50 hover:border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 group-hover:bg-[#0d1f5c] group-hover:text-white transition-colors flex items-center justify-center text-[#0d1f5c] shrink-0">
                          {trip.mode.includes("transit") ? (
                            <Bus size={20} />
                          ) : (
                            <Car size={20} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-400 mb-1 tracking-wider uppercase">
                            {new Date(
                              trip.created_at || "",
                            ).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 text-base font-bold text-[#0d1f5c] truncate">
                            <span className="truncate max-w-[120px] sm:max-w-[180px]">
                              {formatLocationName(trip.origin)}
                            </span>
                            <ChevronRight
                              size={16}
                              className="text-indigo-300 shrink-0"
                            />
                            <span className="truncate max-w-[120px] sm:max-w-[180px]">
                              {formatLocationName(trip.destination)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p
                            style={{ fontFamily: '"Sora", sans-serif' }}
                            className="text-base font-black text-[#0d1f5c]"
                          >
                            {trip.distance_km}
                            <span className="text-[10px] text-slate-400 font-bold ml-1">
                              km
                            </span>
                          </p>
                          <p
                            style={{ fontFamily: '"Sora", sans-serif' }}
                            className="text-base font-black text-[#0d1f5c]"
                          >
                            {trip.duration_mins}
                            <span className="text-[10px] text-slate-400 font-bold ml-1">
                              min
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedTrip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1f5c]/95 backdrop-blur-xl p-4 transition-opacity duration-300">
          <div className="relative w-full max-w-[360px] h-[640px] bg-[#0a0f1c] rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col p-6 text-white border-[4px] border-[#1e293b] transform scale-100 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedTrip(null)}
              className="absolute top-5 right-5 p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors z-30"
            >
              <X size={20} />
            </button>

            <div
              className="absolute inset-0 z-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#4f46e5 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            <svg
              className="absolute inset-0 w-full h-full z-10 pointer-events-none"
              viewBox="0 0 360 640"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              <path
                d="M 80,500 Q 140,400 110,300 T 260,160"
                stroke="url(#route-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]"
              />
              <path
                d="M 80,500 Q 140,400 110,300 T 260,160"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="4 8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              />
              <defs>
                <linearGradient
                  id="route-gradient"
                  x1="80"
                  y1="500"
                  x2="260"
                  y2="160"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#f43f5e" />
                  <stop offset="1" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute top-[140px] right-[40px] max-w-[140px] text-right z-20">
              <p
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-lg font-black leading-tight drop-shadow-md mb-1"
              >
                {formatLocationName(selectedTrip.destination)}
              </p>
              <div className="w-5 h-5 rounded-full bg-indigo-400 border-4 border-[#0a0f1c] shadow-[0_0_15px_rgba(129,140,248,1)] ml-auto"></div>
            </div>
            <div className="absolute top-[480px] left-[50px] max-w-[140px] z-20">
              <div className="w-5 h-5 rounded-full bg-rose-500 border-4 border-[#0a0f1c] shadow-[0_0_15px_rgba(244,63,94,1)] mb-1"></div>
              <p
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-lg font-black leading-tight drop-shadow-md"
              >
                {formatLocationName(selectedTrip.origin)}
              </p>
            </div>

            <div className="relative z-30 flex flex-col h-full pointer-events-none">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <img
                      src="/aila-icon.png"
                      alt="Aila"
                      className="w-5 h-5 opacity-90 grayscale brightness-200 contrast-200"
                    />
                  </div>
                  <span
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="font-black text-lg tracking-widest uppercase text-white"
                  >
                    Aila.
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/30">
                  {selectedTrip.mode}
                </span>
              </div>

              <div className="mt-auto bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/90 to-transparent pt-12 pb-2 -mx-6 px-6">
                <div className="mb-6 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-1">
                    Distance
                  </p>
                  <p
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="text-[4.5rem] font-black text-white leading-[0.9] tracking-tighter"
                  >
                    {selectedTrip.distance_km}
                    <span className="text-3xl text-slate-400 ml-1 font-bold">
                      km
                    </span>
                  </p>
                </div>

                <div className="flex gap-10 border-t border-white/10 pt-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
                      Time
                    </p>
                    <p
                      style={{ fontFamily: '"Sora", sans-serif' }}
                      className="text-2xl font-black text-white"
                    >
                      {selectedTrip.duration_mins}
                      <span className="text-sm text-slate-400 ml-1 font-bold">
                        m
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
                      Pace Avg
                    </p>
                    <p
                      style={{ fontFamily: '"Sora", sans-serif' }}
                      className="text-2xl font-black text-white"
                    >
                      {(
                        selectedTrip.duration_mins /
                        (selectedTrip.distance_km || 1)
                      ).toFixed(1)}
                      <span className="text-sm text-slate-400 ml-1 font-bold">
                        m/km
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 w-full max-w-[360px] px-6">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#f43f5e] text-white py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:bg-[#e11d48] active:scale-95 transition-all">
              <Share2 size={18} /> Share Activity
            </button>
            <button className="flex items-center justify-center w-14 h-14 shrink-0 bg-[#1e293b]/80 backdrop-blur-xl text-white rounded-2xl border border-slate-600 hover:bg-[#334155] active:scale-95 transition-all shadow-xl">
              <Download size={22} />
            </button>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c7d2fe; }
      `,
        }}
      />
    </div>
  );
}
