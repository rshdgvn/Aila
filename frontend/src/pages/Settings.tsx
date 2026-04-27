import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, CheckCircle2, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usersApi } from "../config/api";
import Sidebar from "../components/Sidebar";

export default function Settings() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await usersApi.updateProfile({
        firstName,
        lastName,
        profile_picture: "",
      });

      const token = localStorage.getItem("aila_token");
      if (token && user) {
        login(token, { ...user, firstName, lastName });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="min-h-[100svh] w-full bg-[#f4f7ff] flex flex-col md:flex-row text-[#0d1f5c]"
      style={{ fontFamily: '"Raleway", sans-serif' }}
    >
      <Sidebar
        activeTab="profile"
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between bg-white px-6 py-5 border-b border-indigo-100 z-30 sticky top-0 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-[#f8f9ff] text-[#0d1f5c] rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h1
              style={{ fontFamily: '"Sora", sans-serif' }}
              className="text-xl font-black text-[#0d1f5c]"
            >
              Profile Settings
            </h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 bg-indigo-50 text-indigo-600 rounded-xl"
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-[2rem] p-8 border border-indigo-50 shadow-xl shadow-indigo-100/40">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-indigo-50">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <User size={24} />
                </div>
                <div>
                  <h2
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="text-xl font-bold text-[#0d1f5c]"
                  >
                    Edit Profile
                  </h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">
                    Update your personal information.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-[2rem] border-4 border-[#f8f9ff] bg-indigo-50 shadow-lg shadow-indigo-100/50 flex items-center justify-center relative">
                    <span className="text-5xl font-black text-indigo-300 uppercase">
                      {firstName?.charAt(0) ||
                        user?.firstName?.charAt(0) ||
                        "U"}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">
                    Avatar
                  </p>
                </div>

                <div className="flex-1 space-y-5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-5 py-4 bg-[#f8f9ff] border border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl text-sm font-bold text-[#0d1f5c] outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-5 py-4 bg-[#f8f9ff] border border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl text-sm font-bold text-[#0d1f5c] outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || saved || !firstName || !lastName}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 disabled:opacity-80 ${
                        saved
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30"
                          : "bg-[#0d1f5c] hover:bg-indigo-700 text-white shadow-indigo-900/20"
                      }`}
                    >
                      {isSaving ? (
                        "Saving..."
                      ) : saved ? (
                        <>
                          <CheckCircle2 size={18} /> Saved successfully!
                        </>
                      ) : (
                        <>
                          <Save size={18} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
