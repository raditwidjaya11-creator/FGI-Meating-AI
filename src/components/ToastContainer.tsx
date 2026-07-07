import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Bell,
  Clock,
  Video,
  MapPin,
  Copy,
  Check,
  X,
  Sparkles,
  Calendar,
  Volume2
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function ToastContainer() {
  const { toasts, removeToast, setActiveMeetingId } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (text: string, toastId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(toastId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isMeeting = toast.type === "meeting";
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="pointer-events-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              {/* Header block */}
              <div className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  toast.type === "success" 
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    : toast.type === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                    : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
                }`}>
                  {isMeeting ? <Bell size={18} className="animate-bounce" /> : <Sparkles size={18} />}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                      {toast.title}
                    </span>
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {toast.message}
                  </p>
                </div>
              </div>

              {/* Special action block for scheduled meeting reminders */}
              {isMeeting && toast.meeting && (
                <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850 px-4 py-3 space-y-3">
                  <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <Clock size={12} className="text-indigo-500" />
                      <span>{toast.meeting.startTime} - {toast.meeting.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {toast.meeting.locationType === "Online" || toast.meeting.locationType === "Hybrid" ? (
                        <Video size={12} className="text-blue-500" />
                      ) : (
                        <MapPin size={12} className="text-amber-500" />
                      )}
                      <span className="truncate">{toast.meeting.locationDetail}</span>
                    </div>
                    {toast.meeting.project && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-purple-500" />
                        <span className="truncate bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-1 rounded">
                          {toast.meeting.project}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setActiveMeetingId(toast.meeting!.id);
                        removeToast(toast.id);
                      }}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Video size={11} />
                      Luncurkan Rapat
                    </button>

                    {toast.meeting.meetingLink && (
                      <button
                        onClick={() => handleCopyLink(toast.meeting!.meetingLink!, toast.id)}
                        className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                        title="Salin Tautan Rapat"
                      >
                        {copiedId === toast.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span className="hidden sm:inline">Salin Link</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        // Dismiss current toast, but let it trigger again on the next check interval
                        removeToast(toast.id);
                      }}
                      className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-850 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      Snooze
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
