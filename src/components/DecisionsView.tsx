/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Decision, UserRole } from "../types";
import {
  Award,
  Filter,
  Search,
  CheckCircle,
  FileSignature,
  Calendar,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  UserCheck
} from "lucide-react";

export const DecisionsView: React.FC = () => {
  const { decisions, updateDecisionStatus, signDecision, users, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: "Pending" | "Approved" | "Implemented") => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      updateDecisionStatus(id, status);
    }
  };

  // Signature pad state
  const [activeSignDecision, setActiveSignDecision] = useState<Decision | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch =
      d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.decisionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "All" || d.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const toggleExpand = (id: string) => {
    setExpandedDecisionId(expandedDecisionId === id ? null : id);
  };

  // Setup drawing events for digital signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSignDecision) return;

    // Grab canvas data URL
    const signatureUrl = canvas.toDataURL("image/png");
    signDecision(activeSignDecision.id, signatureUrl);
    setActiveSignDecision(null);
  };

  // Initialize canvas with white color when signature board opens
  useEffect(() => {
    if (activeSignDecision && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeSignDecision]);

  const canSign = [UserRole.SUPER_ADMIN, UserRole.DIREKTUR, UserRole.MANAGER].includes(currentUser.role);

  const renderKanbanColumn = (
    statusKey: "Pending" | "Approved" | "Implemented",
    title: string,
    badgeStyle: string,
    columnDecisions: Decision[]
  ) => {
    return (
      <div
        onDragOver={(e) => handleDragOver(e, statusKey)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, statusKey)}
        className={`bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 p-4 min-h-[600px] flex flex-col gap-3 transition-all duration-300 ${
          dragOverColumn === statusKey
            ? "border-blue-500 bg-blue-50/10 dark:bg-blue-950/10 ring-4 ring-blue-500/5 scale-[1.01]"
            : "border-slate-200/50 dark:border-slate-850/60"
        }`}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              statusKey === "Pending" ? "bg-amber-500" : statusKey === "Approved" ? "bg-emerald-500" : "bg-indigo-500"
            }`} />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle}`}>
            {columnDecisions.length}
          </span>
        </div>

        {/* Card list or empty placeholder */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[750px] pr-1">
          {columnDecisions.length > 0 ? (
            columnDecisions.map((d) => {
              const isExpanded = expandedDecisionId === d.id;
              const hasSigned = d.signatures.some((s) => s.userId === currentUser.id);
              const picUser = users.find((u) => u.id === d.picId);

              return (
                <div
                  key={d.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, d.id)}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all p-3.5 space-y-3 relative group"
                >
                  {/* Card Header row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200/30 dark:border-slate-800/50">
                      {d.decisionNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        d.priority === "High"
                          ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-500/10"
                          : d.priority === "Medium"
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-500/10"
                          : "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-500/10"
                      }`}>
                        {d.priority}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                    {d.description}
                  </p>

                  {/* Metadata line */}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug space-y-1 pt-2 border-t border-slate-100 dark:border-slate-900/60">
                    <div className="flex items-center gap-1">
                      <Calendar size={10} className="shrink-0 text-slate-400" />
                      <span className="truncate">Rapat: <strong>{d.meetingTitle}</strong></span>
                    </div>
                    {picUser && (
                      <div className="flex items-center gap-1">
                        <UserCheck size={10} className="shrink-0 text-slate-400" />
                        <span>PIC: <strong className="text-slate-600 dark:text-slate-400">{picUser.name}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Footer Action panel */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      <FileSignature size={11} className="text-slate-400" />
                      <span>{d.signatures.length}/2 Signatures</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(d.id);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 transition-colors"
                      title="Ulas detail & TTD"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expanded signature and history area */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-900/80 pt-3 mt-3 space-y-4 animate-fade-in text-left">
                      {/* Signatures Area */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                          Tanda Tangan ({d.signatures.length}/2)
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {d.signatures.map((sig, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800 text-[10px] font-sans text-slate-600 dark:text-slate-300 shadow-sm flex flex-col justify-between space-y-1.5"
                            >
                              <div className="border-b border-dashed border-slate-200 dark:border-slate-800 pb-1.5 flex items-center justify-between gap-1.5">
                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{sig.userName}</span>
                                <span className="text-[8px] text-slate-400 shrink-0">{sig.timestamp}</span>
                              </div>
                              <div className="h-8 flex items-center justify-center bg-white dark:bg-slate-950/60 rounded border border-slate-100 dark:border-slate-900 overflow-hidden">
                                {sig.signatureData.startsWith("data:image/") ? (
                                  <img src={sig.signatureData} className="max-h-8 max-w-full object-contain filter dark:invert" alt="Signature stamp" />
                                ) : (
                                  <span className="font-mono text-[9px] text-blue-500 font-bold select-all">{sig.signatureData.substring(0, 16)}...</span>
                                )}
                              </div>
                              <div className="text-center text-[7px] text-emerald-500 uppercase tracking-widest font-black flex items-center justify-center gap-0.5">
                                <CheckCircle size={7} /> SECURE VERIFIED
                              </div>
                            </div>
                          ))}

                          {d.signatures.length < 2 && (
                            <div className="p-2.5 border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/20">
                              <span className="text-[9px] text-slate-400 font-bold mb-1.5">Menunggu TTD Pimpinan</span>
                              {canSign && !hasSigned ? (
                                <button
                                  onClick={() => setActiveSignDecision(d)}
                                  className="text-[9px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded-lg cursor-pointer transition-all shadow-sm"
                                >
                                  Tandatangani
                                </button>
                              ) : (
                                <span className="text-[8px] text-slate-500 font-mono">Pimpinan Saja</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Audit Trail Area */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-900/60">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                          Audit Trail
                        </span>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                          {d.history && d.history.length > 0 ? (
                            d.history.map((log, lIdx) => (
                              <div key={lIdx} className="text-[9px] leading-relaxed pl-2.5 border-l-2 border-blue-500 relative py-0.5">
                                <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-500 -left-[4.5px] top-1.5"></div>
                                <div className="flex items-center justify-between text-slate-400 gap-2">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{log.userName}</span>
                                  <span className="font-mono text-[8px]">{log.date}</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400">{log.action}</p>
                              </div>
                            ))
                          ) : (
                            <span className="text-[9px] text-slate-400">Belum ada aktivitas audit log.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-100/10 text-slate-400 text-center text-xs min-h-[180px] my-auto">
              <AlertCircle size={20} className="text-slate-300 dark:text-slate-700 mb-1.5" />
              <p className="font-semibold text-slate-400 dark:text-slate-600">Kolom Kosong</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-[160px] mx-auto mt-0.5 leading-snug">
                Seret keputusan ke sini untuk mengubah status secara langsung.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upper header controls */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="text-blue-600 w-5 h-5" />
          Matriks &amp; Keputusan Rapat (MoM)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ulas matriks keputusan direksi, otorisasi tanda tangan digital instan, dan pantau status keputusan dalam papan Kanban interaktif.
        </p>
      </div>

      {/* Grid Filter controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari keputusan berdasarkan kode DEC, deskripsi, kategori..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">Semua Prioritas</option>
            <option value="High">Tinggi (High)</option>
            <option value="Medium">Sedang (Medium)</option>
            <option value="Low">Rendah (Low)</option>
          </select>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: Pending */}
        {renderKanbanColumn(
          "Pending",
          "Menunggu / Ditinjau (Pending)",
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          filteredDecisions.filter(
            (d) => d.status === "Pending" || d.status === "Draft" || d.status === "Under Review" || d.status === "Rejected"
          )
        )}

        {/* Column 2: Approved */}
        {renderKanbanColumn(
          "Approved",
          "Disetujui (Approved)",
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          filteredDecisions.filter((d) => d.status === "Approved")
        )}

        {/* Column 3: Implemented */}
        {renderKanbanColumn(
          "Implemented",
          "Terealisasi (Implemented)",
          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
          filteredDecisions.filter((d) => d.status === "Implemented")
        )}
      </div>

      {/* Signature Board Modal dialog popup */}
      {activeSignDecision && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileSignature size={15} className="text-blue-600" />
                Tanda Tangan Digital Direksi
              </h3>
              <button
                onClick={() => setActiveSignDecision(null)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Dokumen Target</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 leading-relaxed truncate">
                {activeSignDecision.decisionNumber}: {activeSignDecision.description}
              </p>
            </div>

            <div className="space-y-1">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Tanda Tangan di Bawah</span>
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full block"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
              >
                Bersihkan Pad
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSignDecision(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveSignature}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-md"
                >
                  Sematkan Tanda Tangan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
