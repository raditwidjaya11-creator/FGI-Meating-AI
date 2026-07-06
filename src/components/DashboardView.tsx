/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
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
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from "recharts";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Briefcase,
  TrendingUp,
  FileCheck,
  UserCheck2,
  Hourglass
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const { meetings, decisions, actionItems, users } = useApp();

  // 1. Dynamic Metric Calculations
  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter((m) => m.status === "Completed").length;
  const ongoingMeetings = meetings.filter((m) => m.status === "Ongoing").length;
  const scheduledMeetings = meetings.filter((m) => m.status === "Scheduled").length;
  const postponedMeetings = meetings.filter((m) => m.status === "Postponed").length;

  const totalDecisions = decisions.length;
  const totalTasks = actionItems.length;
  const completedTasks = actionItems.filter((t) => t.status === "Completed").length;
  const taskProgressPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Find longest and shortest completed meeting
  const completedMtgs = meetings.filter((m) => m.status === "Completed");
  const meetingDurations = completedMtgs.map((m) => m.durationMinutes || 60);
  const longestMeeting = meetingDurations.length ? Math.max(...meetingDurations) : 0;
  const shortestMeeting = meetingDurations.length ? Math.min(...meetingDurations) : 0;

  // Calculate average attendance rate
  const attendanceRate = meetings.length
    ? Math.round(
        (meetings.reduce((acc, curr) => acc + (curr.participantIds?.length || 0), 0) /
          (meetings.length * users.length)) *
          100
      )
    : 0;

  // 2. Charts Data Compilation
  // Chart A: Monthly meetings count (Simulated distributed)
  const monthlyData = [
    { name: "Jan", Rapat: 4 },
    { name: "Feb", Rapat: 6 },
    { name: "Mar", Rapat: 5 },
    { name: "Apr", Rapat: 8 },
    { name: "Mei", Rapat: 12 },
    { name: "Jun", Rapat: meetings.length + 6 },
    { name: "Jul", Rapat: meetings.length + 8 }
  ];

  // Chart B: Departmental activity stats
  const deptActivity = [
    { name: "Operasional", Rapat: 12, Tugas: 18 },
    { name: "IT", Rapat: 10, Tugas: 14 },
    { name: "Direksi", Rapat: 6, Tugas: 5 },
    { name: "Keuangan", Rapat: 4, Tugas: 8 },
    { name: "HRD", Rapat: 3, Tugas: 4 }
  ];

  // Chart C: Action Item Completion Progress
  const taskCompletionData = [
    { name: "Completed", value: completedTasks },
    { name: "In Progress / Review", value: totalTasks - completedTasks },
    { name: "Not Started", value: actionItems.filter((t) => t.status === "Not Started").length }
  ].filter((d) => d.value > 0);

  if (taskCompletionData.length === 0) {
    taskCompletionData.push({ name: "Belum Ada Tugas", value: 1 });
  }

  const COLORS_PIE = ["#22c55e", "#3b82f6", "#f59e0b", "#64748b"];

  // Chart D: Productivity Trend (Fictional score based on decisions & tasks completed)
  const productivityTrend = [
    { name: "W1", Efektivitas: 65, Keputusan: 2 },
    { name: "W2", Efektivitas: 72, Keputusan: 4 },
    { name: "W3", Efektivitas: 80, Keputusan: 5 },
    { name: "W4", Efektivitas: 88, Keputusan: totalDecisions }
  ];

  return (
    <div className="space-y-6">
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Utama
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pusat analisis manajemen rapat, matriks keputusan, dan pemantauan tindak lanjut secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 px-4 py-2.5 rounded-xl">
          <TrendingUp className="text-blue-600 dark:text-blue-400 w-4 h-4" />
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
            Rasio Efektivitas: {attendanceRate}% Kehadiran
          </span>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <CalendarDays size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Rapat Bulan Ini</span>
            <span className="block text-2xl font-bold text-slate-800 dark:text-slate-100">{totalMeetings}</span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
              <span className="text-blue-600 font-medium">{ongoingMeetings} Berjalan</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">{scheduledMeetings} Terjadwal</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            <FileCheck size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Keputusan Rapat (MoM)</span>
            <span className="block text-2xl font-bold text-slate-800 dark:text-slate-100">{totalDecisions}</span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
              <span className="text-emerald-600 font-medium">Semua Terikat MoM</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Penyelesaian Action Item</span>
            <span className="block text-2xl font-bold text-slate-800 dark:text-slate-100">{taskProgressPct}%</span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
              <span className="font-semibold text-amber-600">{completedTasks} dari {totalTasks} Selesai</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
            <Clock size={22} />
          </div>
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Durasi Rapat Selesai</span>
            <span className="block text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              {longestMeeting}m / {shortestMeeting}m
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
              <span>Rapat Terlama / Terpendek</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Layout: Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Box 1: Grafik Meeting Bulanan & Efektivitas */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Aktivitas Rapat Bulanan</h3>
              <span className="text-[11px] text-slate-400 block">Kuantitas pelaksanaan rapat bulanan</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded bg-blue-500"></span>
              <span className="text-slate-600 dark:text-slate-400">FGi Internal</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMtg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Rapat" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMtg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Box 2: Progress Penyelesaian Tugas (Donut Chart) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">Status Penugasan</h3>
          <span className="text-[11px] text-slate-400 block mb-4">Metrik penyelesaian rencana aksi lapangan</span>
          <div className="h-52 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskCompletionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {taskCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="block text-2xl font-bold text-slate-800 dark:text-slate-100">{taskProgressPct}%</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tuntas</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {taskCompletionData.map((d, index) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_PIE[index % COLORS_PIE.length] }}></span>
                <span className="text-slate-600 dark:text-slate-400 truncate">{d.name}: <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Box 3: Departemen Teraktif */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">Departemen Teraktif</h3>
          <span className="text-[11px] text-slate-400 block mb-4">Rapat & penugasan per departemen</span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Rapat" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tugas" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Box 4: Produktivitas & Keputusan Trend */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Grafik Produktivitas</h3>
              <span className="text-[11px] text-slate-400 block">Indeks efisiensi penuntasan keputusan (Skala 1-100)</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Efektivitas" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} name="Indeks Efektivitas (%)" />
                <Line type="monotone" dataKey="Keputusan" stroke="#f59e0b" strokeWidth={2.5} name="Total Keputusan Disahkan" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
