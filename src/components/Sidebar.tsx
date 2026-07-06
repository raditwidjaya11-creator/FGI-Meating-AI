/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";
import {
  LayoutDashboard,
  Calendar,
  Award,
  CheckSquare,
  Search,
  BarChart3,
  Database,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Moon,
  Sun,
  ShieldAlert,
  Send
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed
}) => {
  const { currentUser, users, setCurrentUser, darkMode, setDarkMode } = useApp();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: Object.values(UserRole) },
    { id: "meetings", label: "Penjadwalan & Rapat", icon: Calendar, roles: Object.values(UserRole) },
    { id: "decisions", label: "Keputusan (MoM)", icon: Award, roles: Object.values(UserRole) },
    { id: "tasks", label: "Action Items & Tugas", icon: CheckSquare, roles: Object.values(UserRole) },
    { id: "delegation", label: "Pendelegasian Mandat", icon: Send, roles: Object.values(UserRole) },
    { id: "knowledge", label: "Knowledge Base & AI", icon: Search, roles: Object.values(UserRole) },
    { id: "reports", label: "Analisis & Laporan", icon: BarChart3, roles: Object.values(UserRole) },
    { 
      id: "master", 
      label: "Master Data", 
      icon: Database, 
      roles: [UserRole.SUPER_ADMIN, UserRole.DIREKTUR, UserRole.MANAGER] 
    }
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(currentUser.role));

  return (
    <div
      className={`relative h-screen bg-slate-900 text-white flex flex-col justify-between transition-all duration-300 border-r border-slate-800 shadow-xl ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Header Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white tracking-wide shadow-md shadow-blue-500/20">
              FG
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-slate-100 block">FGi Meeting AI</span>
              <span className="text-[10px] text-blue-400 font-medium tracking-widest block uppercase">Enterprise</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white mx-auto shadow-md">
            FG
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 flex items-center justify-center z-50 cursor-pointer shadow-md transition-transform"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 py-4 overflow-y-auto space-y-1.5 px-3">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 font-semibold"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white animate-pulse" : "text-slate-400"} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* AI Storage Usage */}
      {!collapsed && (
        <div className="p-4 mx-3 mb-2 bg-slate-800/40 border border-slate-700/50 rounded-xl">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 font-mono">AI Storage Usage</p>
          <div className="h-1 w-full bg-slate-700/60 rounded-full mb-1.5 animate-pulse">
            <div className="h-full w-3/4 bg-blue-500 rounded-full"></div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium font-mono">
            <span>75.2 GB of 100 GB</span>
            <span className="text-blue-400 font-semibold">75%</span>
          </div>
        </div>
      )}

      {/* Footer & Active Role Selector */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30 flex flex-col gap-2">
        {/* Toggle Dark/Light Mode */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
        >
          {darkMode ? (
            <>
              <Sun size={14} className="text-amber-400" />
              {!collapsed && <span>Ubah ke Light Mode</span>}
            </>
          ) : (
            <>
              <Moon size={14} className="text-blue-400" />
              {!collapsed && <span>Ubah ke Dark Mode</span>}
            </>
          )}
        </button>

        {/* User Role Pill Console */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all duration-200 cursor-pointer"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-600"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-slate-200 truncate">{currentUser.name}</span>
                <span className="block text-[10px] text-blue-400 font-medium truncate flex items-center gap-1">
                  <UserCheck size={10} /> {currentUser.role}
                </span>
              </div>
            )}
          </button>

          {showRoleSelector && !collapsed && (
            <div className="absolute bottom-14 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1 border-b border-slate-700 mb-1">
                <ShieldAlert size={12} className="text-amber-500" />
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Console RBAC Mock</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowRoleSelector(false);
                    }}
                    className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      currentUser.id === user.id ? "bg-blue-600/30 text-blue-300 font-semibold" : "text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <img src={user.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{user.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{user.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
