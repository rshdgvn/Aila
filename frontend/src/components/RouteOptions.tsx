import {
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
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
  if (!routesData) return null;

  return (
    <div className="w-full md:w-[400px] lg:w-[440px] bg-white flex flex-col z-20 shadow-2xl shrink-0 h-[60vh] md:h-full overflow-hidden transition-all duration-300 relative">
      <header className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
        <div
          style={{ fontFamily: '"Sora", sans-serif' }}
          className="font-extrabold text-xl tracking-tight text-[#0d1f5c]"
        >
          Trip Choices
        </div>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Select a route to view details
        </p>
      </header>

      {/* Main scrollable list */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3 no-scrollbar bg-slate-50">
        {routesData.routes?.map((route: any, i: number) => {
          const isSelected = selectedRouteIdx === i;

          return (
            <div
              key={i}
              className={`rounded-[20px] transition-all border overflow-hidden ${isSelected ? "border-indigo-600 bg-white shadow-md ring-1 ring-indigo-600" : "border-slate-200 bg-white hover:border-indigo-300 shadow-sm"}`}
            >
              {/* Clickable Header Area */}
              <div
                onClick={() => setSelectedRouteIdx(isSelected ? null : i)}
                className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                {/* Standard Minimalist Badges */}
                {route.insights && route.insights.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {route.insights.map((insight: string, idx: number) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                          insight === "Cheapest"
                            ? "bg-emerald-100 text-emerald-800"
                            : insight === "Fastest"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {insight}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="font-bold text-[#0d1f5c] text-[15px] leading-snug">
                    {route.summary || `Route Option ${i + 1}`}
                  </div>
                  <div
                    className={`shrink-0 transition-colors ${isSelected ? "text-indigo-600" : "text-slate-400"}`}
                  >
                    {isSelected ? (
                      <ChevronUp size={22} />
                    ) : (
                      <ChevronDown size={22} />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600 text-[13px] font-semibold">
                    <Clock size={16} className="text-indigo-400" />
                    {Math.round(route.total_duration_mins)} min
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 text-[13px] font-semibold">
                    <MapPin size={16} className="text-indigo-400" />
                    {route.total_distance_km.toFixed(1)} km
                  </div>
                  <div
                    style={{ fontFamily: '"Sora", sans-serif' }}
                    className="text-lg text-[#0d1f5c] font-black ml-auto tracking-tight"
                  >
                    ₱{route.grand_total_fare.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Expanded Detailed Steps */}
              {isSelected && (
                <div className="px-5 pb-5 pt-0 bg-white">
                  <div className="space-y-4 mt-2 relative">
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-indigo-100 z-0 rounded-full"></div>

                    {route.legs.map((leg: any, idx: number) => (
                      <div key={idx} className="flex gap-4 relative z-10">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center shadow-sm">
                            {leg.type === "WALKING" ? (
                              <Footprints
                                size={14}
                                className="text-slate-400"
                              />
                            ) : leg.type === "TRANSIT" ? (
                              <Train size={14} className="text-indigo-600" />
                            ) : (
                              <Car size={14} className="text-indigo-600" />
                            )}
                          </div>
                        </div>
                        <div className="pt-1.5 pb-2">
                          <p className="text-[13px] font-semibold text-slate-700 leading-snug">
                            {stripHtml(leg.instructions)}
                          </p>
                          {leg.estimated_fare > 0 && (
                            <p className="text-[11px] font-bold text-emerald-600 mt-1">
                              Fare: ₱{leg.estimated_fare.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Adds padding to the bottom so the last item isn't hidden by the sticky footer */}
        {selectedRouteIdx !== null && <div className="h-24"></div>}
      </div>

      {/* Sticky Bottom Action Bar */}
      {selectedRouteIdx !== null && (
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 shadow-[0_-15px_30px_rgba(13,31,92,0.08)] z-30">
          <div className="flex gap-3">
            <button
              onClick={handleSaveForLater}
              disabled={saving || saved}
              className="flex-1 py-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Bookmark size={18} /> Save
            </button>
            <button
              onClick={handleStartJourney}
              disabled={saving || saved}
              className={`flex-[2] py-4 text-white text-sm font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${saved ? "bg-emerald-500 shadow-emerald-500/30" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"}`}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : saved ? (
                <>
                  <CheckCircle2 size={20} /> Done!
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" /> Start Live Tracking
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
