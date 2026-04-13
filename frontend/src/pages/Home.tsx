import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  Map,
  LayoutDashboard,
  ArrowRight,
  ChevronRight,
  Heart,
  Car,
  Bus,
  Route,
  Compass,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Share2,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!document.getElementById("raleway-sora-font")) {
      const link = document.createElement("link");
      link.id = "raleway-sora-font";
      link.href =
        "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const TICKER_ITEMS = [
    { label: "Smart Routing", sub: "Fastest & cheapest paths" },
    { label: "Real-Time Chat", sub: "Your trip assistant" },
    { label: "Fare & Fuel", sub: "Cost estimation" },
    { label: "Trip History", sub: "Save every journey" },
    { label: "Drive & Commute", sub: "All modes supported" },
  ];

  const FEATURES = [
    {
      icon: <Route size={22} strokeWidth={1.8} />,
      accent: "#4f46e5",
      accentBg: "#eef2ff",
      name: "Smart Trip Selection",
      desc: "Enter your destination and choose the best trip based on time, cost, and convenience. Includes fare and fuel cost estimation.",
    },
    {
      icon: <MessageCircle size={22} strokeWidth={1.8} />,
      accent: "#7c3aed",
      accentBg: "#f5f3ff",
      name: "Real-Time Assistant",
      desc: "Chat with Aila during your trip. Ask for your ETA, location updates, or navigation help to reduce travel anxiety.",
    },
    {
      icon: <Map size={22} strokeWidth={1.8} />,
      accent: "#0891b2",
      accentBg: "#ecfeff",
      name: "Live Trip Tracking",
      desc: "Automatically record your distance, duration, routes, and total trip cost in the background while you travel.",
    },
    {
      icon: <Share2 size={22} strokeWidth={1.8} />,
      accent: "#059669",
      accentBg: "#ecfdf5",
      name: "Effortless Trip Sharing",
      desc: "Keep your loved ones in the loop. Share your live location, chosen route, and exact ETA with friends in just one tap for ultimate peace of mind.",
    },
  ];

  const JOURNEY_OPTIONS = [
    {
      icon: <Car size={24} />,
      name: "Driving",
      tag: "Fuel Estimator",
      tagStyle: "bg-blue-50 text-blue-800 border border-blue-200",
      desc: "Get real-time navigation for your personal vehicle. Track your driving distance, time, and estimate your fuel costs before hitting the road.",
    },
    {
      icon: <Bus size={24} />,
      name: "Commuting",
      tag: "Fares Included",
      tagStyle: "bg-indigo-50 text-indigo-800 border border-indigo-200",
      desc: "Navigate the public transport network seamlessly. Aila provides step-by-step transit directions and exact fare computations.",
    },
  ];

  const HOW_STEPS = [
    {
      num: "01",
      title: "Enter destination",
      desc: "Search where you want to go. Aila generates the best trip options based on fastest time and lowest cost.",
    },
    {
      num: "02",
      title: "Select & start",
      desc: "Pick your route and begin tracking. Aila acts as your real-time assistant to answer questions while you move.",
    },
    {
      num: "03",
      title: "Save & review",
      desc: "Arrive safely. Your trip duration, route, and costs are automatically recorded and summarized in your dashboard.",
    },
  ];

  const STATS = [
    { num: "Live", label: "Chat Assistant" },
    { num: "2", label: "Travel Modes" },
    { num: "100%", label: "Trip Tracking" },
    { num: "1", label: "Smart Companion" },
  ];

  return (
    <div
      className="min-h-screen bg-[#f0f4ff] text-[#0d1f5c] overflow-x-hidden flex flex-col"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
        <nav
          className={`max-w-7xl mx-auto h-[68px] flex items-center justify-between px-6 rounded-2xl transition-all duration-300 pointer-events-auto ${
            scrolled
              ? "bg-white/85 backdrop-blur-xl border border-indigo-100 shadow-[0_8px_30px_rgba(0,0,0,0.07)]"
              : "bg-white/50 backdrop-blur-md border border-white/60 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src="/aila-icon.png"
              alt="Aila"
              className="w-8 h-8 object-contain"
            />
            <span
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-xl font-extrabold text-[#0d1f5c] tracking-tight"
            >
              Aila.
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <span className="px-4 py-2 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50/80 cursor-pointer">
              Home
            </span>
            <a
              href="#problem"
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-white/60 transition-all"
            >
              Why Aila
            </a>
            <a
              href="#hiw"
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-white/60 transition-all"
            >
              How it works
            </a>
            <a
              href="#about"
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-white/60 transition-all"
            >
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:block text-sm font-bold text-slate-500 hover:text-indigo-600 px-4 py-2 transition-all"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-[#0d1f5c] hover:bg-indigo-600 text-white text-sm font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-900/20"
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>

      <main className="relative flex-1 flex flex-col pt-28">
        <div className="relative max-w-7xl mx-auto w-full px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 items-center min-h-[82vh] py-10 lg:py-0">
          <div
            className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-indigo-200/30 pointer-events-none"
            style={{ filter: "blur(70px)" }}
          />
          <div
            className="absolute left-[35%] bottom-0 w-56 h-56 rounded-full bg-blue-200/20 pointer-events-none"
            style={{ filter: "blur(40px)" }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(99,102,241,0.11) 1.5px, transparent 1.5px)",
              backgroundSize: "34px 34px",
            }}
          />

          <div className="relative z-10 flex flex-col">
            <div className="mb-6">
              <h1
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold leading-[1.05] tracking-tight text-[#0d1f5c] mb-1"
              >
                Plan, Track, and Navigate
              </h1>
              <h1
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold leading-[1.05] tracking-tight text-[#0d1f5c]"
              >
                with{" "}
                <span className="relative inline-block">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    Ai
                  </span>
                  <span className="text-indigo-600">la.</span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full overflow-visible"
                    viewBox="0 0 200 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 7 Q50 2 100 6 Q150 10 198 4"
                      stroke="#818cf8"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>
            </div>

            <p className="text-[17px] leading-[1.75] text-slate-500 font-medium max-w-lg mb-10">
              Your AI-powered trip assistant for commuting and driving. Get
              smart routes, track your costs, and chat for real-time guidance to
              stay informed and confident throughout your journey.
            </p>

            <div className="bg-white rounded-2xl border border-indigo-100/80 p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-0 mb-8 shadow-[0_8px_40px_rgba(99,102,241,0.11)] relative z-20">
              <div className="flex items-center gap-3 flex-1 px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-indigo-600" />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">
                    Where to?
                  </p>
                  <input
                    type="text"
                    placeholder="Search destination to start..."
                    className="w-full bg-transparent text-sm font-bold text-[#0d1f5c] outline-none placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>
              </div>
              <div className="hidden sm:block w-px self-stretch bg-indigo-100 my-2" />
              <button
                onClick={() => navigate("/login")}
                className="mt-2 sm:mt-0 h-12 sm:h-auto bg-[#0d1f5c] hover:bg-indigo-600 text-white font-extrabold text-sm px-8 py-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
              >
                <Route size={17} />
                Find Route
              </button>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex -space-x-2.5">
                {["#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1"].map((bg, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-white"
                    style={{ background: bg }}
                  >
                    {["R", "G", "E", "+"][i]}
                  </div>
                ))}
              </div>
              <p className="text-[13px] font-semibold text-slate-500">
                A wider and smarter view of your trips{" "}
                <span className="font-extrabold text-[#0d1f5c]">
                  every single day
                </span>
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-center h-full py-10 lg:py-0">
            <div className="relative w-[360px] h-[360px] md:w-[400px] md:h-[400px] flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-200/60" />
              <div className="absolute inset-6 rounded-full bg-white/60 border border-indigo-100 backdrop-blur-sm" />

              <div
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ animation: "birdFloat 5s ease-in-out infinite" }}
              >
                <img
                  src="/aila-relax.png"
                  alt="Aila mascot"
                  className="w-96 h-96 md:w-96 md:h-96 object-contain"
                  style={{
                    filter: "drop-shadow(0 20px 40px rgba(79,70,229,0.18))",
                  }}
                />
              </div>

              <div className="absolute top-4 right-[-16px] md:right-[-44px] z-20 bg-white rounded-2xl border border-indigo-100 p-4 w-[178px] shadow-[0_8px_32px_rgba(99,102,241,0.15)]">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                    <MessageCircle size={11} className="text-indigo-600" />
                  </div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                    You asked
                  </p>
                </div>
                <p className="text-[13px] font-black text-[#0d1f5c] leading-snug mb-2.5">
                  "How much is the fare?"
                </p>
                <div className="w-full h-px bg-indigo-50 mb-2.5" />
                <p className="text-[11px] font-bold text-indigo-600 leading-snug">
                  Aila: It is exactly ₱25...
                </p>
              </div>

              <div className="absolute bottom-8 left-[-16px] md:left-[-52px] z-20 bg-white rounded-2xl border border-indigo-100 p-4 w-[162px] shadow-[0_8px_32px_rgba(99,102,241,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Dashboard
                  </p>
                  <LayoutDashboard size={13} className="text-emerald-500" />
                </div>
                <p className="text-[15px] font-black text-[#0d1f5c] leading-snug mb-1.5">
                  Trip Recorded!
                </p>
                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> 45 mins · 12 km
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0d1f5c] py-4 overflow-hidden mt-4">
          <div
            className="flex"
            style={{
              animation: "scroll 24s linear infinite",
              width: "max-content",
            }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-8 whitespace-nowrap"
              >
                <Compass size={14} className="text-indigo-400 flex-shrink-0" />
                <span className="text-sm font-extrabold text-white">
                  {item.label}
                </span>
                <span className="text-indigo-600 font-light select-none px-1">
                  |
                </span>
                <span className="text-sm font-medium text-indigo-300">
                  {item.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <section
        id="problem"
        className="bg-white py-24 px-6 lg:px-12 border-b border-indigo-50"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            style={{ fontFamily: '"Sora", sans-serif' }}
            className="text-3xl md:text-4xl font-extrabold text-[#0d1f5c] tracking-tight mb-8"
          >
            Aila is built for real travel challenges.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
              <AlertCircle className="text-rose-500 mb-4" size={28} />
              <h3 className="font-bold text-[#0d1f5c] mb-2">Unsure Routes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Finding the best and fastest way to reach your destination is
                often confusing, whether driving or commuting.
              </p>
            </div>
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
              <AlertCircle className="text-rose-500 mb-4" size={28} />
              <h3 className="font-bold text-[#0d1f5c] mb-2">Hidden Costs</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Travelers constantly face uncertainty about exactly how much a
                trip will cost in transit fares or fuel expenses.
              </p>
            </div>
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
              <AlertCircle className="text-rose-500 mb-4" size={28} />
              <h3 className="font-bold text-[#0d1f5c] mb-2">Travel Anxiety</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Navigating long distances brings stress and confusion. Aila
                replaces this uncertainty with real-time confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9ff] py-24 px-6 lg:px-12 border-b border-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
            <h2
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-4xl md:text-5xl font-extrabold text-[#0d1f5c] tracking-tight leading-tight"
            >
              Everything you need
              <br />
              for a smarter trip.
            </h2>
            <p className="text-slate-500 font-medium text-base max-w-md leading-relaxed lg:text-right">
              Unlike regular navigation apps that only give directions, Aila
              shows different trip options and provides a real-time assistant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.name}
                className="group relative rounded-3xl p-7 border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-[0_16px_48px_rgba(99,102,241,0.10)] hover:-translate-y-1.5 transition-all duration-300 cursor-default overflow-hidden"
              >
                <span
                  className="absolute -right-1 -bottom-3 text-[80px] font-extrabold select-none pointer-events-none text-[#0d1f5c] opacity-[0.035]"
                  style={{ fontFamily: '"Sora", sans-serif' }}
                >
                  {i + 1}
                </span>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: f.accentBg, color: f.accent }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-[15px] font-bold text-[#0d1f5c] mb-2.5 leading-snug"
                >
                  {f.name}
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="hiw" className="bg-white py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
            <h2
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-4xl md:text-5xl font-extrabold text-[#0d1f5c] tracking-tight leading-tight"
            >
              How Aila guides
              <br />
              your journey.
            </h2>
            <p className="text-slate-500 font-medium text-base max-w-sm leading-relaxed lg:text-right">
              Just three steps to replace travel uncertainty with a confident,
              fully tracked experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            <div className="hidden md:block absolute top-[52px] left-[calc(33.33%+28px)] right-[calc(33.33%+28px)] h-px border-t-2 border-dashed border-indigo-200" />

            {HOW_STEPS.map((step, i) => (
              <div
                key={i}
                className="bg-[#f8f9ff] rounded-3xl p-8 relative border border-indigo-100/50 shadow-sm hover:shadow-md hover:border-indigo-200 hover:bg-white transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold mb-7 ${
                    i === 1
                      ? "bg-[#0d1f5c] text-white shadow-lg shadow-[#0d1f5c]/15"
                      : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                  }`}
                  style={{ fontFamily: '"Sora", sans-serif' }}
                >
                  {step.num}
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-[52px] right-[-22px] z-10 w-10 h-10 bg-white border border-indigo-100 rounded-full items-center justify-center shadow-sm">
                    <ArrowRight size={16} className="text-indigo-400" />
                  </div>
                )}
                <h3
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-xl font-bold text-[#0d1f5c] mb-3"
                >
                  {step.title}
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f0f4ff] py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <h2
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-4xl md:text-5xl font-extrabold text-[#0d1f5c] tracking-tight mb-5 leading-tight"
            >
              For both drivers
              <br />
              and commuters.
            </h2>
            <p className="text-lg text-slate-500 font-medium mb-10 max-w-lg leading-relaxed">
              No matter how you move, Aila is built to support your journey.
              Compare trip options based on what matters most to you today.
            </p>

            <div className="flex flex-col gap-4">
              {JOURNEY_OPTIONS.map((mode) => (
                <div
                  key={mode.name}
                  className="flex items-start gap-5 p-6 rounded-3xl bg-white border border-indigo-100/60 hover:border-indigo-200 hover:shadow-[0_8px_32px_rgba(99,102,241,0.10)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#f8f9ff] border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                    {mode.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3
                        style={{ fontFamily: '"Sora", sans-serif' }}
                        className="text-base font-bold text-[#0d1f5c]"
                      >
                        {mode.name}
                      </h3>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${mode.tagStyle}`}
                      >
                        {mode.tag}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                      {mode.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 w-full relative">
            <div
              className="absolute -inset-4 rounded-[3rem] bg-indigo-100/40 pointer-events-none"
              style={{ filter: "blur(28px)" }}
            />
            <img
              src="/tracker-preview.png"
              alt="Aila Journey Tracker"
              className="relative z-10 w-full rounded-[2rem] shadow-2xl border-4 border-white object-cover"
            />
          </div>
        </div>
      </section>

      <section
        id="about"
        className="bg-[#0d1f5c] py-28 px-6 lg:px-12 relative overflow-hidden"
      >
        <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/8 right-[-200px] bottom-[-300px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-white/5" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <CheckCircle2
                size={16}
                className="text-indigo-400"
                fill="currentColor"
                stroke="#0d1f5c"
              />
              <span
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-sm font-bold text-indigo-400 tracking-wide"
              >
                The Agila Vision
              </span>
            </div>
            <h2
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6"
            >
              A wider, smarter
              <br className="hidden md:block" />
              view of your trips.
            </h2>
            <p className="text-indigo-100/75 text-[16px] leading-[1.82] font-medium mb-5">
              The name Aila comes from Agila (the Philippine Eagle). Just as an
              eagle possesses sharp vision to see the entire landscape, Aila
              gives you a clear bird's-eye view of your entire travel
              experience.
            </p>
            <p className="text-indigo-100/75 text-[16px] leading-[1.82] font-medium mb-10">
              One simple platform that combines routing, tracking, cost
              computations, and real-time support to help you make smarter and
              more confident decisions.
            </p>
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-3 bg-white hover:bg-indigo-50 text-[#0d1f5c] font-extrabold text-[15px] px-8 py-4 rounded-xl transition-all shadow-xl shadow-black/10"
            >
              Start tracking with Aila
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="bg-white/5 border border-white/10 rounded-3xl p-7 hover:bg-white/10 transition-colors duration-200"
              >
                <div
                  style={{ fontFamily: '"Sora", sans-serif' }}
                  className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2"
                >
                  {s.num}
                </div>
                <div className="text-sm text-indigo-200/80 font-semibold leading-snug">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#040a1f] px-6 lg:px-12 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/aila-icon.png"
              alt="Aila"
              className="w-8 h-8 object-contain opacity-90"
            />
            <span
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="font-extrabold text-white text-xl tracking-wide"
            >
              Aila.
            </span>
          </div>
          <div className="flex items-center gap-6 mb-8">
            <a
              href="#problem"
              className="text-sm text-white/50 font-semibold hover:text-white transition-colors"
            >
              Why Aila
            </a>
            <a
              href="#hiw"
              className="text-sm text-white/50 font-semibold hover:text-white transition-colors"
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-sm text-white/50 font-semibold hover:text-white transition-colors"
            >
              About
            </a>
          </div>
          <div className="w-16 h-px bg-white/10 mb-8" />
          <p className="text-xs text-white/40 font-medium mb-2">
            © 2026 Aila. Your AI Trip Assistant.
          </p>
          <p className="text-xs text-white/30 font-medium">
            Developed by{" "}
            <span className="text-indigo-400 font-bold">BSIS Students</span> ·
            La Verdad Christian College
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes birdFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
