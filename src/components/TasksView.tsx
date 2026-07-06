/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { ActionItem, UserRole } from "../types";
import {
  CheckSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Upload,
  Calendar
} from "lucide-react";

export const TasksView: React.FC = () => {
  const { actionItems, toggleChecklistItem, submitEvidence, approveActionItem, users, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Evidence submit dialog state
  const [activeEvidenceTask, setActiveEvidenceTask] = useState<ActionItem | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");

  const filteredTasks = actionItems.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.taskNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.meetingTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmitEvidenceClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvidenceTask || !evidenceNote) return;

    submitEvidence(activeEvidenceTask.id, evidenceNote);
    setActiveEvidenceTask(null);
    setEvidenceNote("");
  };

  const isApprover = [UserRole.SUPER_ADMIN, UserRole.DIREKTUR, UserRole.MANAGER].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header and explanation */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="text-blue-600 w-5 h-5" />
          Rencana Tindak Lanjut & Action Items
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ulas daftar penugasan rapat, centang sub-tugas lapangan, kirim dokumen bukti penyelesaian, dan dapatkan persetujuan pimpinan.
        </p>
      </div>

      {/* Filtering and search bars */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari tugas berdasarkan nama, nomor task, atau asal rapat..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">Semua Status</option>
            <option value="Not Started">Belum Mulai</option>
            <option value="In Progress">Dalam Proses</option>
            <option value="In Review">Menunggu Review</option>
            <option value="Completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Cards collection of tasks */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const picUser = users.find((u) => u.id === task.picId);
            const isPIC = currentUser.id === task.picId;

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm p-5 space-y-4 hover:border-blue-500/20 dark:hover:border-blue-500/10 transition-all"
              >
                {/* Meta details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded">
                      {task.taskNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.status === "Completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                          : task.status === "In Review"
                          ? "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400"
                          : task.status === "In Progress"
                          ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {task.status === "Completed"
                        ? "Selesai"
                        : task.status === "In Review"
                        ? "Menunggu Review"
                        : task.status === "In Progress"
                        ? "Dalam Proses"
                        : "Belum Mulai"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{task.priority} Priority</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={12} className="text-slate-400" />
                    <span>Tenggat: <strong className="text-red-500 dark:text-red-400">{task.deadline}</strong></span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{task.name}</h3>
                  <span className="text-[11px] text-slate-400 block">Rapat Origin: <strong>{task.meetingTitle}</strong></span>
                </div>

                {/* Checklist sub-items block */}
                {task.checklist && task.checklist.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs">
                    <span className="block font-semibold text-[11px] text-slate-400 uppercase tracking-wider mb-1">Daftar Sub-Tugas</span>
                    <div className="space-y-1.5">
                      {task.checklist.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={sub.done}
                            disabled={task.status === "Completed"}
                            onChange={() => toggleChecklistItem(task.id, sub.id)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`text-xs ${sub.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {sub.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress bar info */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Kemajuan Tugas</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${task.progress}%` }}
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    ></div>
                  </div>
                </div>

                {/* Submited evidence preview block */}
                {task.evidenceNote && (
                  <div className="p-3 border border-dashed border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10 rounded-xl text-xs space-y-1.5">
                    <span className="block font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider">Dokumen Bukti Terlampir</span>
                    <p className="text-slate-600 dark:text-slate-300 italic">"{task.evidenceNote}"</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <FileText size={10} /> {task.evidenceUrl}
                    </div>
                  </div>
                )}

                {/* Foot bar info with PIC avatar + Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-3.5">
                  <div className="flex items-center gap-2.5">
                    <img src={picUser?.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                    <div className="text-xs">
                      <span className="block font-medium text-slate-700 dark:text-slate-300">{picUser?.name}</span>
                      <span className="block text-[10px] text-slate-400">{picUser?.role} • {picUser?.department}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* PIC button to submit evidence */}
                    {isPIC && task.status !== "Completed" && task.status !== "In Review" && (
                      <button
                        onClick={() => setActiveEvidenceTask(task)}
                        className="px-3.5 py-2 rounded-xl border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={13} /> Kirim Bukti Kerja
                      </button>
                    )}

                    {/* Manager button to approve submitted evidence */}
                    {isApprover && task.status === "In Review" && (
                      <button
                        onClick={() => approveActionItem(task.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/15"
                      >
                        <CheckCircle2 size={13} /> Setujui Penyelesaian
                      </button>
                    )}

                    {task.status === "Completed" && (
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-500/10 flex items-center gap-1.5">
                        <CheckCircle2 size={13} /> Disetujui: {task.approvedBy || "Direktur"}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl">
            <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Tidak ada action item tugas ditemukan.</p>
          </div>
        )}
      </div>

      {/* Evidence Submit modal popup */}
      {activeEvidenceTask && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitEvidenceClick}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm w-full rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={15} className="text-blue-600" />
                Kirim Bukti Penyelesaian Kerja
              </h3>
              <button
                type="button"
                onClick={() => setActiveEvidenceTask(null)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Tugas Terpilih</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 leading-relaxed truncate">
                {activeEvidenceTask.taskNumber}: {activeEvidenceTask.name}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Keterangan / Memo Bukti</label>
              <textarea
                required
                rows={3}
                placeholder="Deskripsikan hasil penuntasan tugas secara komprehensif..."
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">File Lampiran Bukti</span>
              <div className="p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-slate-50 dark:bg-slate-950/20 text-xs text-slate-400 flex flex-col items-center justify-center">
                <FileText size={20} className="text-slate-400 mb-1" />
                <span>uploaded_evidence_document.pdf</span>
                <span className="text-[10px] text-slate-400 mt-1">Simulated Upload Complete</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveEvidenceTask(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Kirim Laporan Review
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};
