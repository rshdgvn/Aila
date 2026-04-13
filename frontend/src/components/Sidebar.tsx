import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  MapPin,
  Compass,
  LogOut,
  X,
  User,
} from "lucide-react";

interface SidebarProps {
  activeTab: "dashboard" | "saved" | "profile";
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTab,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navClass = (isActive: boolean) =>
    isActive
      ? "group flex items-center justify-between px-4 py-3.5 bg-[#0d1f5c] text-white rounded-2xl font-bold w-full shadow-lg shadow-indigo-900/20"
      : "group flex items-center justify-between px-4 py-3.5 hover:bg-indigo-50/80 text-slate-500 hover:text-[#0d1f5c] rounded-2xl font-bold w-full transition-colors";

  const iconClass = (isActive: boolean) => (isActive ? "text-indigo-300" : "");

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#0d1f5c]/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-indigo-100/50 flex flex-col p-5 sm:p-6 shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none shrink-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {onCloseMobile && (
          <button
            className="md:hidden absolute top-5 right-5 sm:top-6 sm:right-6 text-slate-400 hover:text-indigo-600"
            onClick={onCloseMobile}
          >
            <X size={24} />
          </button>
        )}

        <div className="flex items-center gap-3 mb-8 sm:mb-10 px-2 mt-2">
          <img
            src="/aila-icon.png"
            alt="Aila"
            className="w-9 h-9 object-contain"
          />
          <span
            style={{ fontFamily: '"Sora", sans-serif' }}
            className="text-2xl sm:text-3xl font-black tracking-tight text-[#0d1f5c]"
          >
            Aila.
          </span>
        </div>

        <div className="flex flex-col gap-2 flex-1 overflow-y-auto no-scrollbar">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-4 flex items-center gap-2">
            <Compass size={12} /> Navigation
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                navigate("/dashboard");
                onCloseMobile?.();
              }}
              className={navClass(activeTab === "dashboard")}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  size={18}
                  className={iconClass(activeTab === "dashboard")}
                />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => {
                navigate("/saved-places");
                onCloseMobile?.();
              }}
              className={navClass(activeTab === "saved")}
            >
              <div className="flex items-center gap-3">
                <MapPin
                  size={18}
                  className={iconClass(activeTab === "saved")}
                />
                Saved Places
              </div>
            </button>
            <button
              onClick={() => {
                navigate("/settings");
                onCloseMobile?.();
              }}
              className={navClass(activeTab === "profile")}
            >
              <div className="flex items-center gap-3">
                <User
                  size={18}
                  className={iconClass(activeTab === "profile")}
                />
                Profile
              </div>
            </button>
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-indigo-100/50 shrink-0">
          <div className="flex items-center gap-3 px-2 mb-5 sm:mb-6 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d1f5c] to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden min-w-0">
              <p
                style={{ fontFamily: '"Sora", sans-serif' }}
                className="text-sm font-bold text-[#0d1f5c] truncate"
              >
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-500 font-bold rounded-2xl w-full transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </>
  );
}
