import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../config/api";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Ensure fonts are loaded
  useEffect(() => {
    if (!document.getElementById("raleway-sora-font")) {
      const link = document.createElement("link");
      link.id = "raleway-sora-font";
      link.href =
        "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      login(res.token, res.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex text-[#0d1f5c]"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      {/* ── LEFT PANEL (Synced with Home Page Hero) ── */}
      <div className="hidden lg:flex w-1/2 bg-[#f0f4ff] relative overflow-hidden flex-col justify-center px-16 xl:px-24 border-r border-indigo-100/50">
        {/* Background atmosphere matching Home */}
        <div
          className="absolute right-[-80px] top-1/4 w-[520px] h-[520px] rounded-full bg-indigo-200/30 pointer-events-none"
          style={{ filter: "blur(70px)" }}
        />
        <div
          className="absolute left-[15%] bottom-0 w-56 h-56 rounded-full bg-blue-200/20 pointer-events-none"
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

        {/* Logo (Top Left) */}
        <div className="absolute top-8 left-12 xl:left-16 flex items-center gap-3">
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

        {/* Hero Text */}
        <div className="relative z-10 flex flex-col">
          <div className="mb-6">
            <h1
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-5xl xl:text-[4.25rem] font-extrabold leading-[1.05] tracking-tight text-[#0d1f5c] mb-1"
            >
              Welcome back.
            </h1>
            <h1
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-5xl xl:text-[4.25rem] font-extrabold leading-[1.05] tracking-tight"
            >
              Pick up where you{" "}
              <span className="relative inline-block text-indigo-600">
                left off.
                {/* Hand-drawn underline SVG */}
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

          <p className="text-[17px] leading-[1.75] text-slate-500 font-medium max-w-lg">
            Sign in to access your personal dashboard, view your tracked routes,
            and continue your journey with Aila right by your side.
          </p>
        </div>

        {/* Footer Text */}
        <div className="absolute bottom-8 left-12 xl:left-16 z-10 text-slate-400 text-sm font-semibold">
          © 2026 Aila Mobility.
        </div>
      </div>

      {/* ── RIGHT PANEL (Full Scope Form, No Card) ── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white relative overflow-y-auto">
        {/* Back to Home Button */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-500 hover:text-[#0d1f5c] font-bold text-sm transition-colors px-2 py-2 rounded-xl"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Mobile Logo (Visible only on small screens) */}
        <div className="flex lg:hidden absolute top-8 right-8 z-20 items-center gap-2">
          <img
            src="/aila-icon.png"
            alt="Aila"
            className="w-8 h-8 object-contain"
          />
        </div>

        <div className="flex-1 flex items-center justify-center p-8 sm:p-16 lg:px-24">
          <div className="w-full max-w-[420px] relative z-10">
            <h2
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-4xl font-extrabold text-[#0d1f5c] mb-3"
            >
              Log In
            </h2>
            <p className="text-slate-500 font-medium text-[15px] mb-10 leading-relaxed">
              Enter your credentials to securely access your account.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3.5 rounded-xl mb-6 text-sm font-bold flex items-center border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-[13px] font-extrabold text-[#0d1f5c] uppercase tracking-wider mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-4 rounded-xl border border-indigo-100 bg-[#f8f9ff] text-sm font-bold text-[#0d1f5c] outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 placeholder:font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-extrabold text-[#0d1f5c] uppercase tracking-wider mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-4 rounded-xl border border-indigo-100 bg-[#f8f9ff] text-sm font-bold text-[#0d1f5c] outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 placeholder:font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {/* View Password Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mb-2">
                <a
                  href="#"
                  className="text-[13px] font-bold text-indigo-600 hover:text-[#0d1f5c] transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="w-full py-4 mt-2 bg-[#0d1f5c] hover:bg-indigo-600 text-white text-[15px] font-extrabold rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20"
              >
                {loading ? "Logging in..." : "Continue to Dashboard"}
              </button>
            </form>

            <p className="mt-10 text-center text-[14.5px] font-medium text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-extrabold text-indigo-600 hover:text-[#0d1f5c] transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
