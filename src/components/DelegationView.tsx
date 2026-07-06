/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { UserRole, Delegation } from "../types";
import { Send, CheckCircle2, AlertCircle, RefreshCw, Plus, User, FileText, Trash2, Calendar } from "lucide-react";

export const DelegationView: React.FC = () => {
  const { delegations, addDelegation, deleteDelegation, users, meetings, currentUser } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [meetingId, setMeetingId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [reason, setReason] = useState("");

  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId || !toUserId || !reason) return;

    const targetMeeting = meetings.find((m) => m.id === meetingId);
    const targetDelegate = users.find((u) => u.id === toUserId);
    if (!targetMeeting || !targetDelegate) return;

    const newDel: Delegation = {
      id: `del-${Date.now()}`,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId,
      toUserName: targetDelegate.name,
      meetingId,
      meetingTitle: targetMeeting.title,
      date: targetMeeting.date,
      reason,
      status: "Approved"
    };

    addDelegation(newDel);
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setMeetingId("");
    setToUserId("");
    setReason("");
  };

  const isExecutive = [UserRole.SUPER_ADMIN, UserRole.DIREKTUR, UserRole.MANAGER].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="text-blue-600 w-5 h-5" />
            Pendelegasian & Mandat Rapat
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Form delegasi perwakilan pimpinan untuk menghadiri rapat penting jika pimpinan berhalangan hadir.
          </p>
        </div>

        {isExecutive && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus size={14} /> Beri Mandat Delegasi
          </button>
        )}
      </div>

      {/* Grid of active delegations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {delegations.map((del) => {
          const delegatorUser = users.find((u) => u.id === del.fromUserId);
          const representativeUser = users.find((u) => u.id === del.toUserId);

          return (
            <div
              key={del.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded tracking-wider">
                    MANDAT AKTIF
                  </span>
                  {isExecutive && (
                    <button
                      onClick={() => deleteDelegation(del.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Batalkan mandat"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase">Rapat Target</span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{del.meetingTitle}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={12} className="text-slate-400" />
                    <span>Tanggal: {del.date}</span>
                  </div>
                </div>

                {/* Transfer route logic */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <img src={delegatorUser?.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                    <div className="min-w-0">
                      <span className="block font-bold truncate">{del.fromUserName}</span>
                      <span className="block text-[9px] text-slate-400">{delegatorUser?.role}</span>
                    </div>
                  </div>

                  <span className="text-blue-500 font-bold">➔</span>

                  <div className="flex items-center gap-2 text-xs">
                    <img src={representativeUser?.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                    <div className="min-w-0">
                      <span className="block font-bold text-blue-600 truncate">{del.toUserName}</span>
                      <span className="block text-[9px] text-slate-400">{representativeUser?.role}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Alasan & Memo Tugas</span>
                  <p className="text-slate-600 dark:text-slate-300 italic">"{del.reason}"</p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center">
                <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded tracking-wider flex items-center gap-1 uppercase">
                  <CheckCircle2 size={10} /> Otorisasi Tersegel
                </span>
                <span className="text-[10px] text-slate-400">ID: {del.id}</span>
              </div>
            </div>
          );
        })}

        {delegations.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 bg-white dark:bg-slate-900 border rounded-2xl">
            <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Belum ada delegasi pimpinan pengerjaan rapat yang terbit.</p>
          </div>
        )}
      </div>

      {/* Add form modal popup */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDelegation}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm w-full rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Send size={15} className="text-blue-600" />
                Delegasikan Mandat Rapat
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                ×
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Pilih Jadwal Rapat</label>
              <select
                required
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs"
              >
                <option value="">Pilih rapat...</option>
                {meetings
                  .filter((m) => m.status === "Scheduled")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.meetingNumber} - {m.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Delegasikan Kepada (Staff/Mgr)</label>
              <select
                required
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs"
              >
                <option value="">Pilih wakil...</option>
                {users
                  .filter((u) => u.id !== currentUser.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Alasan & Intisari Mandat</label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Berhalangan hadir karena kunjungan dinas luar kota Foresyndo. Mohon berikan tanggapan terkait draf budget kolasi..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-2 border rounded-xl text-xs text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Kirim Otorisasi
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};
