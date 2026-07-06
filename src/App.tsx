/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { MeetingsView } from "./components/MeetingsView";
import { DecisionsView } from "./components/DecisionsView";
import { TasksView } from "./components/TasksView";
import { DelegationView } from "./components/DelegationView";
import { KnowledgeBaseView } from "./components/KnowledgeBaseView";
import { ReportsAnalyticsView } from "./components/ReportsAnalyticsView";
import { MasterDataView } from "./components/MasterDataView";
import { ActiveMeetingCanvas } from "./components/ActiveMeetingCanvas";
import { Meeting } from "./types";

function AppContent() {
  const { darkMode } = useApp();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);

  const renderTabContent = () => {
    if (activeMeeting) {
      return (
        <ActiveMeetingCanvas
          meeting={activeMeeting}
          onBack={() => setActiveMeeting(null)}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "meetings":
        return <MeetingsView onLaunchMeeting={(mtg) => setActiveMeeting(mtg)} />;
      case "decisions":
        return <DecisionsView />;
      case "tasks":
        return <TasksView />;
      case "delegation":
        return <DelegationView />;
      case "knowledge":
        return <KnowledgeBaseView />;
      case "reports":
        return <ReportsAnalyticsView />;
      case "master":
        return <MasterDataView />;
      default:
        return <DashboardView />;
    }
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case "dashboard": return "Dashboard Utama";
      case "meetings": return "Penjadwalan & Rapat";
      case "decisions": return "Keputusan (MoM)";
      case "tasks": return "Action Items & Tugas";
      case "delegation": return "Pendelegasian Mandat";
      case "knowledge": return "Knowledge Base & AI";
      case "reports": return "Analisis & Laporan";
      case "master": return "Master Data";
      default: return "Dashboard";
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-200 ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-[#F8FAFC] text-slate-900"}`}>
      <Sidebar
        activeTab={activeMeeting ? "meetings" : activeTab}
        setActiveTab={(tab) => {
          setActiveMeeting(null);
          setActiveTab(tab);
        }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Clean Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 px-6 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display tracking-tight">
              {activeMeeting ? `Rapat Berjalan: ${activeMeeting.title}` : `FGi Meeting AI • ${getTabLabel()}`}
            </h1>
            {activeMeeting && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/40 animate-pulse font-mono">
                REC: LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-blue-100 dark:border-blue-900/50 shadow-sm transition-all hover:bg-blue-100/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-500"></span>
              </span>
              AI Assistant Active
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderTabContent()}
          </div>
        </main>

        {/* Bottom Activity Rail */}
        <footer className="h-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 px-6 md:px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0 font-mono">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
              Supabase Connected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 
              OpenAI GPT-4 Omni Ready
            </span>
          </div>
          <div>Version 2.4.0 • © 2026 FGi Systems</div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
