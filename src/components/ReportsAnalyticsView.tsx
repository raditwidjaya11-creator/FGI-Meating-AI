/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Coins,
  Smile,
  Users,
  Download,
  FileSpreadsheet,
  FileText,
  Percent,
  Calculator,
  AlertCircle
} from "lucide-react";

export const ReportsAnalyticsView: React.FC = () => {
  const { meetings, decisions, actionItems } = useApp();

  // ROI cost calculator state variables
  const [avgHourlyRate, setAvgHourlyRate] = useState(150000); // Rp 150.000 / jam
  const [attendeeCount, setAttendeeCount] = useState(5);
  const [meetingLength, setMeetingLength] = useState(60); // menit

  // Calculations for meeting cost
  const calculatedCost = Math.round((attendeeCount * (meetingLength / 60) * avgHourlyRate));
  const estimatedSavings = Math.round(calculatedCost * 0.45); // AI automation saves ~45% coordination time

  // Chart Data: Speaker Talking Distribution
  const speakerData = [
    { name: "Ahmad Subagio (Direktur)", value: 40, color: "#3b82f6" },
    { name: "Siti Rahmawati (Manager)", value: 25, color: "#10b981" },
    { name: "Budi Santoso (Supervisor)", value: 20, color: "#f59e0b" },
    { name: "Diana Lestari (Staff)", value: 10, color: "#8b5cf6" },
    { name: "Lainnya (Tanya Jawab)", value: 5, color: "#64748b" }
  ];

  // Chart Data: Sentiment Trends of recent meetings
  const sentimentData = [
    { name: "Kolaboratif / Positif", value: 70, color: "#10b981" },
    { name: "Netral / Fokus Teknis", value: 20, color: "#3b82f6" },
    { name: "Tegang / Resolusi Debat", value: 10, color: "#ef4444" }
  ];

  // Browser Downloader helpers
  const triggerCsvDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDecisions = () => {
    // Generate CSV format
    let csv = "Nomor Keputusan,Tanggal,Kategori,Prioritas,Status,PIC,Rapat Origin,Deskripsi\n";
    decisions.forEach((d) => {
      csv += `"${d.decisionNumber}","${d.date}","${d.category}","${d.priority}","${d.status}","${d.picId}","${d.meetingTitle}","${d.description.replace(/"/g, '""')}"\n`;
    });
    triggerCsvDownload("FGi_Decision_Logs_Report.csv", csv);
  };

  const handleExportTasks = () => {
    let csv = "Nomor Tugas,Nama Tugas,Deadline,Progress (%),Status,Prioritas,Asal Rapat\n";
    actionItems.forEach((t) => {
      csv += `"${t.taskNumber}","${t.name}","${t.deadline}","${t.progress}","${t.status}","${t.priority}","${t.meetingTitle}"\n`;
    });
    triggerCsvDownload("FGi_Action_Items_Tasklist.csv", csv);
  };

  const handleExportMeetings = () => {
    let csv = "Nomor Rapat,Judul,Tipe,Tanggal,Mulai,Selesai,Status,Proyek\n";
    meetings.forEach((m) => {
      csv += `"${m.meetingNumber}","${m.title}","${m.type}","${m.date}","${m.startTime}","${m.endTime}","${m.status}","${m.project}"\n`;
    });
    triggerCsvDownload("FGi_Meetings_Executive_Recap.csv", csv);
  };

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="text-blue-600 w-5 h-5" />
          Dashboard Analisis & Laporan Eksekutif
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ulas analisis sentimen rapat, estimasi biaya rapat, dan unduh laporan penugasan dalam format Excel/CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive ROI calculator */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <Calculator className="text-blue-500 w-4 h-4" />
              Estimator Biaya & ROI Rapat
            </h3>

            {/* Wage input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase block">Rerata Gaji / Jam (Rp)</label>
              <input
                type="number"
                step="10000"
                value={avgHourlyRate}
                onChange={(e) => setAvgHourlyRate(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs"
              />
            </div>

            {/* Sliders */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Jumlah Peserta</span>
                <span className="font-bold">{attendeeCount} Orang</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Durasi Rapat</span>
                <span className="font-bold">{meetingLength} Menit</span>
              </div>
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={meetingLength}
                onChange={(e) => setMeetingLength(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Calculator Output Display Box */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/40 rounded-xl space-y-3 mt-4">
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
              <span>Estimasi Biaya Pertemuan:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                Rp {calculatedCost.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-emerald-600">
              <span className="flex items-center gap-1 font-semibold">
                <Smile size={12} />
                Efisiensi FGi AI (45%):
              </span>
              <span className="font-bold font-mono">
                Rp {estimatedSavings.toLocaleString("id-ID")} Saved
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right charts: Speaker distribution & Sentiment */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Speaker allocation donut chart */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
                Distribusi Waktu Pembicara
              </h4>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={speakerData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                      {speakerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-[10px]">
                {speakerData.map((s) => (
                  <div key={s.name} className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium truncate max-w-[150px]">{s.name}</span>
                    <span className="font-bold" style={{ color: s.color }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment tone of current meetings */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
                Analisis Sentimen & Mood Diskusi
              </h4>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-[10px]">
                {sentimentData.map((s) => (
                  <div key={s.name} className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium truncate">{s.name}</span>
                    <span className="font-bold" style={{ color: s.color }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Download exports panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Ekspor Laporan Korporat</h3>
          <p className="text-xs text-slate-400">Unduh data instan yang kompatibel dengan Microsoft Excel atau pengolah spreadsheet eksternal.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportMeetings}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-950/20 text-left cursor-pointer transition-colors space-y-2 flex flex-col justify-between"
          >
            <FileText className="text-blue-500 w-6 h-6" />
            <div>
              <span className="block font-bold text-slate-800 dark:text-slate-100 text-xs">Rekap Pertemuan (CSV)</span>
              <span className="text-[10px] text-slate-400">Daftar judul, agenda, status, dan proyek</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold pt-1">
              <Download size={11} /> Unduh File
            </div>
          </button>

          <button
            onClick={handleExportDecisions}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-950/20 text-left cursor-pointer transition-colors space-y-2 flex flex-col justify-between"
          >
            <FileSpreadsheet className="text-emerald-500 w-6 h-6" />
            <div>
              <span className="block font-bold text-slate-800 dark:text-slate-100 text-xs">Log Keputusan (CSV)</span>
              <span className="text-[10px] text-slate-400">Matriks keputusan lengkap beserta PIC</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold pt-1">
              <Download size={11} /> Unduh File
            </div>
          </button>

          <button
            onClick={handleExportTasks}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-950/20 text-left cursor-pointer transition-colors space-y-2 flex flex-col justify-between"
          >
            <FileSpreadsheet className="text-amber-500 w-6 h-6" />
            <div>
              <span className="block font-bold text-slate-800 dark:text-slate-100 text-xs">Daftar Action Items (CSV)</span>
              <span className="text-[10px] text-slate-400">Detail status penugasan & deadline</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold pt-1">
              <Download size={11} /> Unduh File
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
