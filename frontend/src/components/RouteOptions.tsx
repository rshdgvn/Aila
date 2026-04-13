import {
  ChevronDown,
  ChevronUp,
  Clock,
  Footprints,
  Train,
  Car,
  Loader2,
  CheckCircle2,
  Play,
  Bookmark,
} from "lucide-react";
import { stripHtml } from "../config/utils";

export default function RouteOptions({
  routesData,
  selectedRouteIdx,
  setSelectedRouteIdx,
  handleStartJourney,
  handleSaveForLater,
  saving,
  saved,
}: any) {
  if (!routesData || !routesData.routes || routesData.routes.length === 0)
    return null;

  const generateSummary = (route: any) => {
    const vehicles: Record<string, number> = {};
    let hasTransit = false;

    (route.legs || []).forEach((leg: any) => {
      if (leg.type === "TRANSIT") {
        hasTransit = true;
        const vType = leg.vehicle_type
          ? leg.vehicle_type.charAt(0).toUpperCase() +
            leg.vehicle_type.slice(1).toLowerCase()
          : "Transit";

        vehicles[vType] = (vehicles[vType] || 0) + 1;
      }
    });

    if (!hasTransit) return route.summary || "Suggested Route";

    const parts = Object.entries(vehicles).map(
      ([type, count]) => `${count} ${type}`,
    );

    if (parts.length === 1) return `via ${parts[0]}`;
    if (parts.length > 1) {
      const last = parts.pop();
      return `via ${parts.join(", ")} and ${last}`;
    }

    return route.summary || "Suggested Route";
  };

  const sortedRoutes = [...routesData.routes]
    .map((route, originalIndex) => ({ route, originalIndex }))
    .sort((a, b) => {
      const aHasBadge = a.route.insights && a.route.insights.length > 0 ? 1 : 0;
      const bHasBadge = b.route.insights && b.route.insights.length > 0 ? 1 : 0;
      return bHasBadge - aHasBadge;
    });

  return (
    <div className="w-full md:w-[400px] lg:w-[440px] bg-white border-t md:border-t-0 md:border-l border-indigo-100 flex flex-col z-20 shadow-[-10px_0_40px_rgba(13,31,92,0.05)] shrink-0 h-[55vh] md:h-full overflow-hidden transition-all duration-300 relative rounded-t-[2rem] md:rounded-none">
      <div className="w-full flex justify-center py-3 md:hidden absolute top-0 left-0 z-30">
        <div className="w-12 h-1.5 bg-indigo-100 rounded-full"></div>
      </div>

      <header className="px-5 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-4 sm:pb-5 border-b border-indigo-50 bg-white/90 backdrop-blur-md shrink-0 z-20">
        <div
          style={{ fontFamily: '"Sora", sans-serif' }}
          className="font-extrabold text-[18px] sm:text-[20px] tracking-tight text-[#0d1f5c]"
        >
          Trip Choices
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Select a route to view details
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 custom-scrollbar pb-[120px] bg-[#f8f9ff]">
        <div className="space-y-3 sm:space-y-4">
          {sortedRoutes.map(({ route, originalIndex }) => {
            const isSelected = selectedRouteIdx === originalIndex;
            const hasInsights = route.insights && route.insights.length > 0;
            const smartSummary = generateSummary(route);

            return (
              <div
                key={originalIndex}
                onClick={() =>
                  setSelectedRouteIdx(isSelected ? null : originalIndex)
                }
                className={`relative rounded-[24px] border-2 transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? "bg-[#0d1f5c] border-[#0d1f5c] shadow-[0_10px_30px_rgba(13,31,92,0.2)] scale-[1.02]"
                    : "bg-white border-indigo-50 hover:border-indigo-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="p-4 sm:p-5 md:p-6 relative">
                  {hasInsights && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {route.insights.map((insight: string, i: number) => {
                        const isFast = insight.toLowerCase().includes("fast");
                        const isCheap = insight.toLowerCase().includes("cheap");

                        let badgeStyle = "bg-indigo-100 text-indigo-700";
                        if (isFast) badgeStyle = "bg-amber-400 text-amber-950";
                        if (isCheap)
                          badgeStyle = "bg-emerald-400 text-emerald-950";

                        return (
                          <span
                            key={i}
                            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${badgeStyle}`}
                          >
                            {insight}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4 sm:mb-5">
                    <div
                      style={{ fontFamily: '"Sora", sans-serif' }}
                      className={`font-bold text-[14px] sm:text-[16px] leading-tight ${isSelected ? "text-white" : "text-[#0d1f5c]"}`}
                    >
                      {smartSummary}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div>
                      <p
                        className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSelected ? "text-indigo-300" : "text-slate-400"}`}
                      >
                        Time
                      </p>
                      <p
                        style={{ fontFamily: '"Sora", sans-serif' }}
                        className={`text-[20px] sm:text-[22px] font-black leading-none ${isSelected ? "text-white" : "text-[#0d1f5c]"}`}
                      >
                        {Math.round(route.total_duration_mins)}
                        <span
                          className={`text-sm font-bold ml-0.5 ${isSelected ? "text-indigo-200" : "text-slate-400"}`}
                        >
                          m
                        </span>
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSelected ? "text-indigo-300" : "text-slate-400"}`}
                      >
                        Est. Fare
                      </p>
                      <p
                        style={{ fontFamily: '"Sora", sans-serif' }}
                        className={`text-[20px] sm:text-[22px] font-black leading-none ${isSelected ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        <span
                          className={`text-sm font-bold mr-0.5 ${isSelected ? "text-emerald-500" : "text-emerald-300"}`}
                        >
                          ₱
                        </span>
                        {route.grand_total_fare || 0}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/10 flex flex-col gap-3 sm:gap-4">
                      {route.legs.map((leg: any, legIdx: number) => {
                        const isWalk = leg.type === "WALKING";
                        const Icon = isWalk
                          ? Footprints
                          : leg.type === "TRANSIT"
                            ? Train
                            : Car;
                        return (
                          <div
                            key={legIdx}
                            className="flex items-start gap-3 relative"
                          >
                            {legIdx !== route.legs.length - 1 && (
                              <div className="absolute top-8 bottom-[-12px] left-[15px] w-0.5 bg-white/10 rounded-full"></div>
                            )}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${isWalk ? "bg-white/10 text-indigo-200" : "bg-indigo-500 text-white"}`}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 pt-1 min-w-0">
                              <p className="text-[12px] font-bold text-white leading-snug">
                                {stripHtml(leg.instructions)}
                              </p>
                              <p className="text-[10px] font-bold text-indigo-200 mt-1 flex items-center gap-1 flex-wrap">
                                <Clock size={10} />{" "}
                                {Math.round(leg.duration_mins)} mins
                                {leg.fare > 0 && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px]">
                                    ₱{leg.fare}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!isSelected && (
                  <div className="bg-indigo-50/50 border-t border-indigo-50 py-3 px-4 sm:px-6 flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                    View Route Details <ChevronDown size={14} />
                  </div>
                )}
                {isSelected && (
                  <div className="bg-white/5 border-t border-white/10 py-3 px-4 sm:px-6 flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 hover:bg-white/10 transition-colors">
                    Close Details <ChevronUp size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedRouteIdx !== null && (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-white/90 backdrop-blur-xl border-t border-indigo-50 shadow-[0_-20px_40px_rgba(13,31,92,0.08)] z-30">
          <div className="flex gap-3">
            <button
              onClick={handleSaveForLater}
              disabled={saving || saved}
              className="flex-1 py-3.5 sm:py-4 bg-[#f8f9ff] hover:bg-indigo-100 border border-indigo-100 text-[#0d1f5c] text-[12px] sm:text-[13px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Bookmark size={16} /> Save
            </button>
            <button
              onClick={handleStartJourney}
              disabled={saving || saved}
              className={`flex-[2] py-3.5 sm:py-4 text-white text-[12px] sm:text-[13px] font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                saved
                  ? "bg-emerald-500 shadow-emerald-500/30"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
              }`}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : saved ? (
                <>
                  <CheckCircle2 size={16} /> Verified
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" /> Start Trip
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
