/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Search,
  MessageSquare,
  Sparkles,
  Send,
  Database,
  Calendar,
  Layers,
  FileText,
  HelpCircle,
  TrendingUp,
  ArrowRight
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export const KnowledgeBaseView: React.FC = () => {
  const { meetings, askAIChat, masterData } = useApp();
  const [searchText, setSearchText] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");

  // AI Chat logs states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "ai",
      text: "Halo! Saya Asisten AI FGi Meeting. Saya memiliki akses ke seluruh basis pengetahuan rapat, keputusan direksi, serta daftar tugas action item Anda secara real-time. Ada yang bisa saya bantu analisa hari ini?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);

  // Suggested questions to trigger instant search
  const suggestions = [
    "Apa keputusan rapat proyek Foresyndo?",
    "Siapa PIC penugasan struktur lantai 5?",
    "Ada berapa rapat yang berjalan bulan ini?",
    "Berapa estimasi alokasi dana darurat yang disepakati?"
  ];

  // Full-text search over meetings
  const searchedMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (m.momMarkdown && m.momMarkdown.toLowerCase().includes(searchText.toLowerCase())) ||
      (m.liveNotes && m.liveNotes.toLowerCase().includes(searchText.toLowerCase()));
    const matchesProject = projectFilter === "All" || m.project === projectFilter;
    return matchesSearch && matchesProject;
  });

  const handleSendChat = async (textToSend: string) => {
    if (!textToSend.trim() || isAskingAI) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsAskingAI(true);

    try {
      const aiResponseText = await askAIChat(textToSend);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAskingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="text-blue-600 w-5 h-5" />
          Knowledge Base & AI Search
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ulas dokumen notulen terdahulu secara full-text, atau diskusikan rekapitulasi, keputusan pimpinan, dan proyeksi dengan FGi AI Chat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Full text search and document listing */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
              Pencarian Dokumen MoM
            </h3>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Cari kata kunci notulen..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Proyek</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">Semua Proyek</option>
                {masterData.projects.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Resulting List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchedMeetings.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400/40 transition-colors flex items-start gap-2.5 cursor-pointer text-xs"
              >
                <FileText className="text-slate-400 shrink-0 w-4 h-4 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-800 dark:text-slate-100 truncate">{m.title}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                    <span>{m.date}</span>
                    <span>•</span>
                    <span className="text-blue-500 font-semibold">{m.project.substring(0, 18)}...</span>
                  </div>
                </div>
              </div>
            ))}
            {searchedMeetings.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4 bg-slate-100/40 dark:bg-slate-900/30 rounded-xl border">
                Tidak ada dokumen yang cocok.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: AI Chat Assistant panel */}
        <div className="lg:col-span-2 flex flex-col h-[520px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-400 w-5 h-5 animate-pulse" />
              <div>
                <span className="block text-xs font-bold text-white">FGi Meeting AI Chat Assistant</span>
                <span className="block text-[10px] text-slate-400">Analisis keputusan & rekapitulasi data rapat real-time</span>
              </div>
            </div>

            <div className="px-2 py-1 rounded bg-slate-800 text-[10px] text-blue-400 font-semibold flex items-center gap-1">
              <TrendingUp size={11} /> Gemini 3.5 Flash
            </div>
          </div>

          {/* Chat scroll records */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`flex gap-3 text-xs max-w-[85%] ${chat.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`p-1.5 w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 ${
                    chat.sender === "user" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {chat.sender === "user" ? "U" : "AI"}
                </div>
                <div
                  className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    chat.sender === "user"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "bg-slate-900 border border-slate-800/80 text-slate-200 shadow-sm"
                  }`}
                >
                  {chat.text}
                  <span className={`block text-[8px] mt-1.5 text-right font-mono ${chat.sender === "user" ? "text-blue-200" : "text-slate-500"}`}>
                    {chat.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isAskingAI && (
              <div className="flex gap-3 text-xs mr-auto">
                <div className="p-1.5 w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center animate-pulse">
                  AI
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl text-slate-400 italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                  <span>FGi AI sedang berpikir menganalisa data rapat...</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompts Grid */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/80">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <HelpCircle size={10} /> Saran Pertanyaan Cepat
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSendChat(s)}
                  className="text-left p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/60 text-[10px] text-slate-400 hover:text-white rounded-lg transition-colors truncate cursor-pointer flex items-center justify-between"
                >
                  <span>{s}</span>
                  <ArrowRight size={10} className="text-slate-600 ml-1 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Form write input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat(chatInput);
            }}
            className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              required
              value={chatInput}
              disabled={isAskingAI}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tanyakan rekapitulasi, penanggung jawab, atau keputusan..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isAskingAI}
              className="px-4 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50 transition-colors"
            >
              Kirim
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
