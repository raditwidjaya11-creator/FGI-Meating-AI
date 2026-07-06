/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { MasterData, UserRole } from "../types";
import { Database, Plus, Check, Tag, Building2, UserCheck, Trash, AlertCircle } from "lucide-react";

export const MasterDataView: React.FC = () => {
  const { masterData, addMasterItem, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<keyof MasterData>("departments");
  const [newItemText, setNewItemText] = useState("");

  const tabMeta: { id: keyof MasterData; label: string; placeholder: string }[] = [
    { id: "departments", label: "Departemen", placeholder: "Nama departemen baru..." },
    { id: "divisions", label: "Divisi Kerja", placeholder: "Nama divisi baru..." },
    { id: "rooms", label: "Ruang Meeting", placeholder: "Contoh: Ruang Singgalang (Lantai 4)..." },
    { id: "clients", label: "Klien", placeholder: "Nama klien korporat baru..." },
    { id: "projects", label: "Proyek", placeholder: "Nama proyek baru..." },
    { id: "vendors", label: "Vendor Rekanan", placeholder: "Nama vendor baru..." }
  ];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    addMasterItem(activeTab, newItemText.trim());
    setNewItemText("");
  };

  const selectedMeta = tabMeta.find((t) => t.id === activeTab);
  const itemsList = (masterData[activeTab] || []) as any[];

  const isAllowedToEdit = [UserRole.SUPER_ADMIN, UserRole.DIREKTUR, UserRole.MANAGER].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Title description */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="text-blue-600 w-5 h-5" />
          Manajemen Master Data Perusahaan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Kelola master list korporat (departemen, divisi, ruang rapat, kemitraan proyek, vendor) untuk sinkronisasi form penjadwalan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Nav menu list */}
        <div className="md:col-span-1 space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Entitas Korporat</span>
          {tabMeta.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setNewItemText("");
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right content view listing and creation */}
        <div className="md:col-span-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Daftar Master: {selectedMeta?.label} ({itemsList.length})
            </h3>
            {isAllowedToEdit ? (
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-500/10 flex items-center gap-1">
                <UserCheck size={11} /> Anda Memiliki Akses Edit
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded border border-amber-500/10 flex items-center gap-1">
                <AlertCircle size={11} /> Mode Lihat Saja (Read-Only)
              </span>
            )}
          </div>

          {/* New Item add form */}
          {isAllowedToEdit && (
            <form onSubmit={handleAddItem} className="flex gap-2.5">
              <input
                type="text"
                required
                placeholder={selectedMeta?.placeholder}
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Tambah Data
              </button>
            </form>
          )}

          {/* Listing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {itemsList.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/20 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2.5 hover:bg-slate-50"
              >
                <Tag size={13} className="text-slate-400 shrink-0" />
                <span className="truncate font-medium">{item}</span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
