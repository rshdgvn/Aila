import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Trip, tripsApi } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import {
  LogOut,
  Plus,
  Navigation2,
  MapPin,
  Calendar,
  Play,
  LayoutDashboard,
  Compass,
  Settings,
  Clock,
  TrendingUp,
  Route,
  Map as MapIcon,
  ChevronRight,
  CircleDot,
  Activity,
  Sparkles,
  Car,
  Bus,
  Menu,
  X,
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!document.getElementById("raleway-sora-font")) {
      const link = document.createElement("link");
      link.id = "raleway-sora-font";
      link.href =
        "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap";
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
  }, []);

  useEffect(() => {
    tripsApi
      .getAll()
      .then((r) => r.data)
      .then(setTrips)
      .catch(console.error);
  }, []);

  const totalDistance = trips.reduce(
    (acc, trip) => acc + (trip.distance_km || 0),
    0,
  );
  const totalTrips = trips.length;

  const getInsightText = () => {
    if (totalTrips === 0) {
      return "Welcome aboard! I'm ready to track your first journey whenever you are. Let's map out something exciting today.";
    }
    if (totalDistance > 100) {
      return `You've covered a massive ${totalDistance.toFixed(
        1,
      )}km so far! Your travel history is looking highly active. Impressive work.`;
    }
    return `You have ${totalTrips} journeys logged safely in your vault. Ready to discover a new route today?`;
  };

  return (
    <div
      className="h-screen w-full bg-[#f0f4ff] flex overflow-hidden text-[#0d1f5c]"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0d1f5c]/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white/95 backdrop-blur-xl border-r border-indigo-100 flex flex-col p-6 shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-[0_8px_30px_rgba(0,0,0,0.03)] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="md:hidden absolute top-6 right-6 text-slate-400 hover:text-indigo-600 transition-colors"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-10 px-2 mt-2">
          <img
            src="/aila-icon.png"
            alt="Aila"
            className="w-8 h-8 object-contain"
          />
          <span
            style={{ fontFamily: '"Sora", sans-serif' }}
            className="text-2xl font-extrabold tracking-tight text-[#0d1f5c]"
          >
            Aila.
          </span>
        </div>

        <div className="flex flex-col gap-2 flex-1 overflow-y-auto no-scrollbar">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-4 flex items-center gap-2">
            <Compass size={12} /> Menu
          </div>
          <button className="group flex items-center justify-between px-4 py-3.5 bg-[#0d1f5c] text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/15 transition-transform hover:-translate-y-0.5 w-full">
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} className="text-indigo-300" />
              Dashboard
            </div>
            <ChevronRight
              size={16}
              className="text-indigo-300 group-hover:translate-x-1 transition-transform"
            />
          </button>
          <button className="flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-[#f8f9ff] hover:text-indigo-600 rounded-2xl font-bold transition-all border border-transparent hover:border-indigo-100 w-full">
            <MapIcon size={18} />
            My Routes
          </button>
          <button className="flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-[#f8f9ff] hover:text-indigo-600 rounded-2xl font-bold transition-all border border-transparent hover:border-indigo-100 w-full">
            <Activity size={18} />
            Analytics
          </button>
          <button className="flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-[#f8f9ff] hover:text-indigo-600 rounded-2xl font-bold transition-all border border-transparent hover:border-indigo-100 w-full">
            <Settings size={18} />
            Settings
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-indigo-100/50 shrink-0">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0d1f5c] text-white flex items-center justify-center shadow-md shadow-indigo-900/20 shrink-0">
              <span
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="font-extrabold text-lg"
              >
                {user?.firstName?.charAt(0) || "U"}
              </span>
            </div>
            <div className="overflow-hidden">
              <p
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-[15px] font-bold text-[#0d1f5c] leading-tight truncate"
              >
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mt-1 flex items-center gap-1 truncate">
                <Sparkles size={10} className="shrink-0" /> Master Explorer
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-rose-50/80 text-rose-500 hover:bg-rose-100 hover:text-rose-600 font-bold rounded-xl transition-colors w-full border border-rose-100/50"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Top Navigation */}
        <div className="md:hidden flex items-center justify-between bg-white/80 backdrop-blur-xl px-4 py-3 border-b border-indigo-100 z-30 sticky top-0">
          <div className="flex items-center gap-2">
            <img src="/aila-icon.png" alt="Aila Logo" className="w-8 h-8" />
            <span
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-xl font-extrabold text-[#0d1f5c]"
            >
              Aila.
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 bg-[#f8f9ff] hover:bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 transition-colors"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-10 scroll-smooth relative no-scrollbar">
          <div
            className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-200/40 pointer-events-none"
            style={{ filter: "blur(80px)" }}
          />

          <div className="max-w-6xl mx-auto space-y-8 md:space-y-10 relative z-10 pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 md:px-2">
              <div>
                <p className="flex items-center gap-2 text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-2">
                  <Calendar size={14} /> {currentDate}
                </p>
                <h1
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-3xl md:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0d1f5c] leading-tight"
                >
                  {greeting},<br className="hidden md:block" />{" "}
                  {user?.firstName}!
                </h1>
              </div>
              <button
                onClick={() => navigate("/new-travel")}
                className="group flex items-center justify-center gap-2 bg-[#0d1f5c] hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-extrabold shadow-xl shadow-indigo-900/20 transition-all hover:-translate-y-1 w-full md:w-auto"
              >
                <Plus
                  size={20}
                  strokeWidth={3}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
                New 
              </button>
            </div>

            {/* AILA INSIGHT CARD */}
            <div className="relative bg-[#0d1f5c] rounded-[2rem] p-5 md:p-8 lg:p-10 shadow-[0_20px_60px_rgba(13,31,92,0.15)] border border-indigo-500/20 mt-4 md:mt-10">
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[60px]" />
                <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] bg-blue-400/20 rounded-full blur-[50px]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20" />
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                <div className="lg:col-span-7 flex flex-col md:flex-row items-center md:items-end gap-2 md:gap-4 relative text-center md:text-left">
                  <div className="relative w-32 h-32 md:w-44 md:h-44 shrink-0 -mb-6 md:mb-0 z-20">
                    <img
                      src="/aila-relax.png"
                      alt="Aila Mascot"
                      className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
                      style={{
                        animation: "birdFloat 5s ease-in-out infinite",
                      }}
                    />
                  </div>

                  <div className="flex-1 w-full relative z-10 pb-0 md:pb-4 pt-4 md:pt-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full mb-3 backdrop-blur-md">
                      <TrendingUp size={12} className="text-indigo-300" />
                      <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">
                        Aila Insight
                      </span>
                    </div>
                    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-5 md:p-6 rounded-3xl md:rounded-tl-3xl rounded-tl-xl md:rounded-bl-none shadow-xl">
                      <p className="text-white text-sm md:text-[15px] font-medium leading-relaxed">
                        "{getInsightText()}"
                      </p>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 md:-left-3 md:top-auto md:translate-x-0 md:bottom-0 w-0 h-0 border-b-[16px] border-b-white/10 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent md:border-r-[0px] md:border-t-[16px] md:border-t-transparent md:border-r-[16px] md:border-r-white/10 md:border-b-[0px] md:border-b-transparent drop-shadow-sm backdrop-blur-xl" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col sm:flex-row gap-4 w-full h-full justify-end mt-4 lg:mt-0">
                  <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] p-5 hover:bg-white/10 transition-colors shadow-inner flex flex-col justify-center min-h-[120px] lg:min-h-[140px]">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-extrabold text-indigo-200 uppercase tracking-widest">
                        Distance
                      </p>
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center text-indigo-300 shrink-0">
                        <Route size={18} />
                      </div>
                    </div>
                    <div
                      style={{ fontFamily: '"Sora", sans-serif' }}
                      className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight tabular-nums"
                    >
                      {totalDistance.toFixed(1)}
                      <span className="text-base text-indigo-300 font-bold ml-1 tracking-normal">
                        km
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-[24px] p-5 hover:bg-white/10 transition-colors shadow-inner flex flex-col justify-center min-h-[120px] lg:min-h-[140px]">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-extrabold text-indigo-200 uppercase tracking-widest">
                        Journeys
                      </p>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center text-emerald-300 shrink-0">
                        <Navigation2 size={18} />
                      </div>
                    </div>
                    <div
                      style={{ fontFamily: '"Sora", sans-serif' }}
                      className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight tabular-nums"
                    >
                      {totalTrips}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT HISTORY SECTION */}
            <div className="px-1 md:px-2 w-full min-w-0">
              <div className="flex items-center justify-between mb-6">
                <h3
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-xl md:text-2xl font-extrabold text-[#0d1f5c] flex items-center gap-3"
                >
                  <Activity
                    size={24}
                    className="text-indigo-600 hidden sm:block"
                  />
                  Recent History
                </h3>
                {trips.length > 0 && (
                  <button className="text-xs md:text-sm font-bold text-indigo-600 hover:text-[#0d1f5c] flex items-center gap-1 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 md:px-4 py-2 rounded-xl shrink-0">
                    View All{" "}
                    <ChevronRight size={14} className="md:w-4 md:h-4" />
                  </button>
                )}
              </div>

              {trips.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-10 md:p-16 text-center border border-indigo-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center w-full">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-[#f8f9ff] rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mb-6 text-indigo-300 border border-indigo-50">
                    <MapIcon
                      size={36}
                      strokeWidth={1.5}
                      className="md:w-10 md:h-10"
                    />
                  </div>
                  <h3
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="text-xl md:text-2xl font-extrabold text-[#0d1f5c] mb-3"
                  >
                    No routes mapped yet
                  </h3>
                  <p className="text-sm md:text-base text-slate-500 font-medium mb-8 max-w-md leading-relaxed px-4">
                    Your travel history is currently empty. Start a new journey
                    to let Aila analyze your routes, time, and distance.
                  </p>
                  <button
                    onClick={() => navigate("/new-travel")}
                    className="bg-[#0d1f5c] text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl font-extrabold hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/15 text-sm md:text-base w-full sm:w-auto justify-center"
                  >
                    <Plus size={18} /> Start Tracking
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 w-full min-w-0">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      className="group bg-white p-4 md:p-5 lg:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-indigo-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.08)] hover:border-indigo-100 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 w-full min-w-0"
                    >
                      {/* Left: Details and Location (Added min-w-0 to prevent overflow) */}
                      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full min-w-0">
                        {/* Icon */}
                        <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 rounded-2xl md:rounded-[1.5rem] bg-[#f8f9ff] flex items-center justify-center border border-indigo-50 text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-50 transition-all duration-300">
                          {trip.mode.toLowerCase().includes("transit") ||
                          trip.mode.toLowerCase().includes("bus") ? (
                            <Bus
                              size={22}
                              className="md:w-6 md:h-6 lg:w-7 lg:h-7"
                            />
                          ) : (
                            <Car
                              size={22}
                              className="md:w-6 md:h-6 lg:w-7 lg:h-7"
                            />
                          )}
                        </div>

                        {/* Route Content */}
                        <div className="flex-1 w-full min-w-0">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f8f9ff] text-slate-500 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-50 whitespace-nowrap">
                              <Calendar size={10} className="text-indigo-400" />
                              <span
                                style={{ fontFamily: '"Sora", sans-serif' }}
                              >
                                {trip.created_at
                                  ? new Date(
                                      trip.created_at,
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "Recent"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100 whitespace-nowrap">
                              {trip.mode}
                            </span>
                            {trip.status === "active" && (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm whitespace-nowrap">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-slate-50/50 p-2.5 md:p-3 rounded-xl border border-slate-100/50 w-full min-w-0">
                            {/* Origin */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <CircleDot
                                  size={10}
                                  className="text-indigo-600"
                                />
                              </div>
                              <div
                                className="text-[#0d1f5c] font-bold text-xs md:text-sm truncate"
                                title={trip.origin}
                              >
                                {trip.origin}
                              </div>
                            </div>
                            
                            <div className="hidden sm:block shrink-0 w-8 md:w-12 relative">
                              <div className="h-px w-full border-t-2 border-dashed border-indigo-200"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 text-indigo-300">
                                <ChevronRight size={12} />
                              </div>
                            </div>

                            <div className="sm:hidden pl-[9px] py-0.5 shrink-0">
                              <div className="w-[2px] h-3 border-l-2 border-dashed border-indigo-200"></div>
                            </div>

                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                <MapPin size={10} className="text-rose-600" />
                              </div>
                              <div
                                className="text-[#0d1f5c] font-bold text-xs md:text-sm truncate"
                                title={trip.destination}
                              >
                                {trip.destination}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stats & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 lg:gap-8 bg-[#f8f9ff] lg:bg-transparent p-3 md:p-4 lg:p-0 rounded-xl border border-indigo-50 lg:border-none w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                        <div className="flex gap-4 md:gap-6 text-[#0d1f5c]">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white lg:bg-[#f8f9ff] flex items-center justify-center shadow-sm lg:shadow-none shrink-0 border border-indigo-50">
                              <Route size={14} className="text-indigo-500" />
                            </div>
                            <div>
                              <div className="text-[9px] md:text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1 md:mb-1.5">
                                Dist
                              </div>
                              <div
                                style={{ fontFamily: '"Sora", sans-serif' }}
                                className="font-extrabold text-[14px] md:text-[16px] leading-none tabular-nums tracking-tight"
                              >
                                {trip.distance_km}
                                <span className="text-[10px] text-slate-400 font-bold ml-0.5 tracking-normal">
                                  km
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="w-px h-8 bg-indigo-100 hidden sm:block"></div>

                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white lg:bg-[#f8f9ff] flex items-center justify-center shadow-sm lg:shadow-none shrink-0 border border-indigo-50">
                              <Clock size={14} className="text-indigo-500" />
                            </div>
                            <div>
                              <div className="text-[9px] md:text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1 md:mb-1.5">
                                Time
                              </div>
                              <div
                                style={{ fontFamily: '"Sora", sans-serif' }}
                                className="font-extrabold text-[14px] md:text-[16px] leading-none tabular-nums tracking-tight"
                              >
                                {trip.duration_mins}
                                <span className="text-[10px] text-slate-400 font-bold ml-0.5 tracking-normal">
                                  min
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {trip.status === "active" && (
                          <button
                            onClick={() =>
                              navigate("/active-journey", {
                                state: { tripId: trip.id },
                              })
                            }
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 hover:scale-105 shadow-lg shadow-emerald-500/20 transition-all duration-300 shrink-0 ml-2"
                          >
                            <Play
                              size={16}
                              fill="currentColor"
                              className="ml-0.5"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes birdFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `,
        }}
      />
    </div>
  );
}
