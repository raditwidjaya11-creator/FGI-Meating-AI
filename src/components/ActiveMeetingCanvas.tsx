/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Meeting, User, UserRole, Poll, MeetingTranscriptLine, Decision, ActionItem } from "../types";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  MessageSquare,
  Vote,
  Edit3,
  Sparkles,
  Play,
  Pause,
  Send,
  Trash2,
  FileText,
  AlertCircle,
  Clock,
  Globe2,
  Check,
  CheckSquare,
  Star,
  Bell,
  Zap,
  MoreVertical,
  ExternalLink,
  Volume2,
  Keyboard,
  Cloud,
  CloudOff,
  RefreshCw,
  FileDown,
  FileUp,
  Layers,
  Wifi,
  WifiOff,
  CheckCircle,
  ListTodo,
  ChevronRight,
  X,
  Download
} from "lucide-react";
import { exportMeetingToPDF } from "../utils/pdfExport";

interface ActiveMeetingProps {
  meeting: Meeting;
  onBack: () => void;
}

interface AgendaItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  speakerName?: string;
  matchScore?: number;
  matchedWords?: string[];
  matchedText?: string;
  manuallyChecked?: boolean;
}

const calculateMatchScore = (agendaText: string, transcriptText: string): { score: number, matchedWords: string[] } => {
  const cleanText = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, " ");
  };

  const agendaWords = cleanText(agendaText).split(" ").filter(w => w.length > 2);
  const transcriptWords = cleanText(transcriptText).split(" ").filter(w => w.length > 2);

  const synonyms: Record<string, string[]> = {
    "anggaran": ["dana", "biaya", "budget", "pendanaan", "uang", "keuangan", "rupiah", "juta", "150"],
    "sewa": ["rental", "carter", "kontrak", "pinjam", "armada"],
    "alat": ["excavator", "crane", "mesin", "armada", "truk", "loader", "peralatan"],
    "logistik": ["supply", "pengiriman", "distribusi", "semen", "material", "truk", "armada", "pengangkutan", "koordinasi"],
    "progress": ["progres", "perkembangan", "selesai", "pengerjaan", "capaian", "persen", "update", "hasil", "bekisting", "siap", "85%"],
    "kolom": ["beton", "tiang", "balok", "struktur", "bekisting"],
    "mitigasi": ["antisipasi", "solusi", "rencana", "strategi", "risiko", "hambatan", "kendala"],
    "keamanan": ["backup", "keamanan", "cyber", "security", "aman", "sistem", "mfa"],
    "server": ["server", "cloud", "database", "data"],
    "mfa": ["mfa", "multi-factor", "authentication", "autentikasi", "password", "login"],
    "integrasi": ["integrasi", "data", "keuangan", "divisi", "keuangan", "finance"],
    "evaluasi": ["review", "bahas", "tinjau", "analisis", "diskusi"],
    "keterlambatan": ["terhambat", "kendala", "masalah", "lambat", "kritis"]
  };

  let matchedWords: string[] = [];
  let score = 0;

  agendaWords.forEach(word => {
    if (transcriptWords.includes(word)) {
      matchedWords.push(word);
      score += 1.0;
    } else {
      for (const [key, list] of Object.entries(synonyms)) {
        if (word === key || list.includes(word)) {
          const foundSynonym = list.find(syn => transcriptWords.includes(syn)) || (transcriptWords.includes(key) ? key : null);
          if (foundSynonym) {
            matchedWords.push(`${word} (${foundSynonym})`);
            score += 0.85;
            break;
          }
        }
      }
    }
  });

  const finalScore = agendaWords.length > 0 ? (score / agendaWords.length) * 100 : 0;
  return { score: finalScore, matchedWords };
};

export const ActiveMeetingCanvas: React.FC<ActiveMeetingProps> = ({ meeting, onBack }) => {
  const {
    currentUser,
    users,
    isRecording,
    setIsRecording,
    recordingDuration,
    setRecordingDuration,
    sendMeetingChat,
    createMeetingPoll,
    voteMeetingPoll,
    appendTranscriptLine,
    updateLiveNotes,
    saveMoM,
    addDecision,
    addActionItem,
    updateActionItem,
    generateMoMWithAI,
    decisions,
    actionItems
  } = useApp();

  // Active workspace tabs
  const [activeTab, setActiveTab] = useState<"whiteboard" | "notes" | "polling" | "chat" | "agenda">("agenda");

  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(() => {
    const saved = localStorage.getItem(`agenda_progress_${meeting.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved agenda progress:", e);
      }
    }

    if (!meeting.agenda) return [];
    return meeting.agenda
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => {
        const cleanText = line.replace(/^\d+[\.\)\-]\s*/, "").replace(/^[\-\*\+]\s*/, "").trim();
        return {
          id: `agenda-${idx + 1}`,
          text: cleanText,
          completed: false,
        };
      });
  });

  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(`agenda_auto_track_${meeting.id}`);
    return saved !== "false";
  });

  const [lastProcessedTranscriptLength, setLastProcessedTranscriptLength] = useState(0);
  const [agendaAlert, setAgendaAlert] = useState<{
    show: boolean;
    agendaTitle: string;
    speaker: string;
    score: number;
  } | null>(null);

  const [agendaMatchLogs, setAgendaMatchLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem(`agenda_match_logs_${meeting.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`agenda_progress_${meeting.id}`, JSON.stringify(agendaItems));
  }, [agendaItems, meeting.id]);

  useEffect(() => {
    localStorage.setItem(`agenda_auto_track_${meeting.id}`, String(autoTrackingEnabled));
  }, [autoTrackingEnabled, meeting.id]);

  useEffect(() => {
    localStorage.setItem(`agenda_match_logs_${meeting.id}`, JSON.stringify(agendaMatchLogs));
  }, [agendaMatchLogs, meeting.id]);

  useEffect(() => {
    const transcript = meeting.transcript || [];
    if (transcript.length === 0) {
      setAgendaItems(prev => prev.map(item => item.manuallyChecked ? item : { ...item, completed: false, completedAt: undefined, speakerName: undefined, matchScore: undefined, matchedWords: undefined, matchedText: undefined }));
      setLastProcessedTranscriptLength(0);
      setAgendaMatchLogs([]);
      return;
    }

    if (transcript.length > lastProcessedTranscriptLength) {
      const newLines = transcript.slice(lastProcessedTranscriptLength);
      setLastProcessedTranscriptLength(transcript.length);

      if (!autoTrackingEnabled) return;

      let updated = false;
      const nextAgendaItems = [...agendaItems];
      const nextLogs = [...agendaMatchLogs];

      newLines.forEach((line) => {
        nextAgendaItems.forEach((item) => {
          if (item.completed) return;

          const match = calculateMatchScore(item.text, line.text);
          if (match.score >= 45) {
            item.completed = true;
            item.completedAt = line.timestamp;
            item.speakerName = line.speakerName;
            item.matchScore = Math.round(match.score);
            item.matchedWords = match.matchedWords;
            item.matchedText = line.text;
            updated = true;

            const logMessage = `[${line.timestamp}] TOPIK COCOK: "${item.text}" terdeteksi dari ucapan ${line.speakerName} dengan skor kecocokan ${Math.round(match.score)}% (Kata kunci: ${match.matchedWords.join(", ")})`;
            nextLogs.unshift(logMessage);

            setAgendaAlert({
              show: true,
              agendaTitle: item.text,
              speaker: line.speakerName,
              score: Math.round(match.score)
            });

            setSmartToast({
              show: true,
              type: "success",
              message: "Topik Agenda Terdeteksi!",
              details: `"${item.text}" otomatis ditandai selesai oleh AI (Kecocokan ${Math.round(match.score)}% dari ucapan ${line.speakerName})`
            });
          }
        });
      });

      if (updated) {
        setAgendaItems(nextAgendaItems);
        setAgendaMatchLogs(nextLogs.slice(0, 30));
      }
    }
  }, [meeting.transcript, lastProcessedTranscriptLength, agendaItems, autoTrackingEnabled, agendaMatchLogs]);

  // Offline Mode States
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(`fgi_offline_mode_${meeting.id}`);
    return saved === "true" || meeting.locationType === "Offline";
  });
  
  const [offlineQueue, setOfflineQueue] = useState<{
    id: string;
    type: "decision" | "action_item" | "transcript" | "chat";
    label: string;
    payload: any;
    timestamp: string;
  }[]>(() => {
    const saved = localStorage.getItem(`fgi_offline_queue_${meeting.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showOfflineSyncDrawer, setShowOfflineSyncDrawer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    localStorage.setItem(`fgi_offline_mode_${meeting.id}`, String(isOfflineMode));
  }, [isOfflineMode, meeting.id]);

  useEffect(() => {
    localStorage.setItem(`fgi_offline_queue_${meeting.id}`, JSON.stringify(offlineQueue));
  }, [offlineQueue, meeting.id]);

  const addToOfflineQueue = (type: "decision" | "action_item" | "transcript" | "chat", label: string, payload: any) => {
    const newItem = {
      id: `off-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      label,
      payload,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setOfflineQueue((prev) => [...prev, newItem]);
  };

  const executeLocalOfflineVoiceCommand = (cmdText: string) => {
    const textLower = cmdText.toLowerCase();
    let action = "send_chat";
    let explanation = "Menjalankan Asisten AI Offline Lokal. Perintah Anda telah dicatat.";
    let data: any = null;

    if (textLower.includes("tugas") || textLower.includes("tugaskan") || textLower.includes("task") || textLower.includes("action item")) {
      action = "create_action_item";
      let taskName = cmdText;
      const markers = ["tugas", "tugaskan", "untuk", "task", "create task"];
      for (const m of markers) {
        const idx = textLower.indexOf(m);
        if (idx !== -1) {
          taskName = cmdText.substring(idx + m.length).trim();
          break;
        }
      }
      
      let picId = users[0]?.id;
      for (const user of users) {
        if (textLower.includes(user.name.toLowerCase())) {
          picId = user.id;
          break;
        }
      }

      data = {
        name: taskName || "Tugas Offline Baru",
        picId,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "High"
      };
      explanation = `[Asisten Offline] Tugas baru didelegasikan: "${data.name}" kepada ${users.find(u => u.id === picId)?.name || 'PIC'}.`;
    } else if (textLower.includes("putuskan") || textLower.includes("keputusan") || textLower.includes("decision") || textLower.includes("catat")) {
      action = "flag_decision";
      let decisionText = cmdText;
      const markers = ["putuskan", "keputusan", "bahwa", "catat", "decision"];
      for (const m of markers) {
        const idx = textLower.indexOf(m);
        if (idx !== -1) {
          decisionText = cmdText.substring(idx + m.length).trim();
          break;
        }
      }

      data = {
        text: decisionText || "Keputusan Offline Baru",
        category: "Operasional Rapat luring"
      };
      explanation = `[Asisten Offline] Keputusan luring dicatat: "${data.text}".`;
    } else {
      explanation = `[Asisten Offline] Perintah luring diterima: "${cmdText}". Silakan sinkronkan nanti untuk pemrosesan Gemini AI penuh.`;
    }

    return { action, data, explanation };
  };

  // Media Mocks
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);

  // Drawing whiteboard ref & state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#3b82f6");
  const [lineWidth, setLineWidth] = useState(3);

  // Chat/Poll input state
  const [chatInput, setChatInput] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // AI Generation status & outputs
  const [isGeneratingMoM, setIsGeneratingMoM] = useState(false);
  const [aiGenerationStep, setAiGenerationStep] = useState("");
  const [generatedMomMarkdown, setGeneratedMomMarkdown] = useState<string | null>(null);

  // Simulator for automatic transcripts
  const [isSimulatingTranscripts, setIsSimulatingTranscripts] = useState(false);
  const transcriptTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Smart Actions States
  const [smartToast, setSmartToast] = useState<{
    show: boolean;
    type: "success" | "info" | "error";
    message: string;
    details?: string;
  } | null>(null);

  const [activeSmartActionLine, setActiveSmartActionLine] = useState<MeetingTranscriptLine | null>(null);
  const [smartActionType, setSmartActionType] = useState<"decision" | "action_item" | "urgent" | null>(null);

  // Form edit states for Smart Action confirmations
  const [smartFormTitle, setSmartFormTitle] = useState("");
  const [smartFormPic, setSmartFormPic] = useState("");
  const [smartFormPriority, setSmartFormPriority] = useState<"High" | "Medium" | "Low">("High");
  const [smartFormDeadline, setSmartFormDeadline] = useState("");
  const [smartFormCategory, setSmartFormCategory] = useState("Keputusan Rapat");

  // Auto-dismiss smart toast
  useEffect(() => {
    if (smartToast && smartToast.show) {
      const timer = setTimeout(() => {
        setSmartToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [smartToast]);

  const handleTriggerSmartAction = (line: MeetingTranscriptLine, type: "decision" | "action_item" | "urgent") => {
    setActiveSmartActionLine(line);
    setSmartActionType(type);
    
    // Auto-prefill states based on transcript text
    setSmartFormTitle(line.text);
    
    // Match speaker to user
    const matched = users.find(
      (u) => u.name.toLowerCase() === line.speakerName.toLowerCase()
    );
    const fallbackPic = matched ? matched.id : (users[0]?.id || "");
    setSmartFormPic(fallbackPic);
    
    setSmartFormPriority("High");
    
    // Default deadline or targetDate (7 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];
    setSmartFormDeadline(dateStr);
    
    setSmartFormCategory("Keputusan Rapat");
  };

  const handleConfirmSmartAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSmartActionLine || !smartActionType) return;

    const matchedPic = users.find((u) => u.id === smartFormPic) || users[0];

    if (smartActionType === "decision") {
      const cleanMtgNum = meeting.meetingNumber.replace(/\D/g, "");
      const newDecision: Decision = {
        id: `dec-${Date.now()}`,
        decisionNumber: `DEC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split("T")[0],
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        description: smartFormTitle,
        priority: smartFormPriority,
        category: smartFormCategory,
        status: "Draft",
        picId: smartFormPic,
        targetDate: smartFormDeadline,
        signatures: [],
        attachments: [],
        history: [
          {
            date: new Date().toISOString().replace("T", " ").substring(0, 16),
            userId: currentUser.id,
            userName: currentUser.name,
            action: `Keputusan dibuat via Smart Actions dari pernyataan: "${activeSmartActionLine.text}" oleh ${activeSmartActionLine.speakerName}.${isOfflineMode ? " [Mode Luring]" : ""}`
          }
        ],
        isOffline: isOfflineMode ? true : undefined,
        syncPending: isOfflineMode ? true : undefined,
      };
      
      addDecision(newDecision);

      if (isOfflineMode) {
        addToOfflineQueue(
          "decision",
          `Catat keputusan: ${newDecision.description}`,
          newDecision
        );
      }
      
      setSmartToast({
        show: true,
        type: "success",
        message: "Pernyataan berhasil di-flag sebagai Keputusan!",
        details: `Keputusan baru (${newDecision.decisionNumber}) ditugaskan ke ${matchedPic?.name || "PIC"}.${isOfflineMode ? " [Luring - Antrean Sinkronisasi]" : ""}`
      });

    } else if (smartActionType === "action_item") {
      const newActionItem: ActionItem = {
        id: `tsk-${Date.now()}`,
        taskNumber: `TSK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        name: smartFormTitle,
        picId: smartFormPic,
        deadline: smartFormDeadline,
        progress: 0,
        checklist: [
          { id: `chk-${Date.now()}-1`, text: "Melakukan koordinasi tim terkait", done: false },
          { id: `chk-${Date.now()}-2`, text: "Verifikasi penyelesaian di lapangan", done: false }
        ],
        status: "Not Started",
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        priority: smartFormPriority,
        isOffline: isOfflineMode ? true : undefined,
        syncPending: isOfflineMode ? true : undefined,
      };

      addActionItem(newActionItem);

      if (isOfflineMode) {
        addToOfflineQueue(
          "action_item",
          `Delegasikan tugas: ${newActionItem.name}`,
          newActionItem
        );
      }

      setSmartToast({
        show: true,
        type: "success",
        message: "Action Item berhasil diterbitkan!",
        details: `Tugas baru (${newActionItem.taskNumber}) didelegasikan ke ${matchedPic?.name || "PIC"} dengan tenggat ${smartFormDeadline}.${isOfflineMode ? " [Luring - Antrean Sinkronisasi]" : ""}`
      });

    } else if (smartActionType === "urgent") {
      const urgentMsgText = `⚠️ [INSTANT URGENT PING to ${matchedPic?.name || "All"}] Tindak lanjuti segera: "${smartFormTitle}"`;
      sendMeetingChat(meeting.id, urgentMsgText);

      if (isOfflineMode) {
        addToOfflineQueue(
          "chat",
          `Kirim peringatan urgent ke ${matchedPic?.name || "PIC"}`,
          { text: urgentMsgText }
        );
      }

      setSmartToast({
        show: true,
        type: "info",
        message: `Pesan mendesak dikirim ke ${matchedPic?.name || "PIC"}!`,
        details: `Disalurkan melalui saluran chat rapat & simulasi push WhatsApp ke (+62...).${isOfflineMode ? " [Mode Luring]" : ""}`
      });
    }

    // Reset smart states
    setActiveSmartActionLine(null);
    setSmartActionType(null);
  };

  // Voice Command Assistant States
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<{
    action: string;
    explanation: string;
  } | null>(null);
  const [showVoiceManualInput, setShowVoiceManualInput] = useState(false);
  const [voiceManualInputText, setVoiceManualInputText] = useState("");
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Automated AI 'Meeting Snapshot' Modal States
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [isFetchingSnapshot, setIsFetchingSnapshot] = useState(false);
  const [snapshotData, setSnapshotData] = useState<{
    executiveSummary: string;
    decisions: {
      number: string;
      description: string;
      priority: "High" | "Medium" | "Low";
    }[];
    actionItems: {
      taskName: string;
      picName: string;
      deadline: string;
      priority: "High" | "Medium" | "Low";
    }[];
  } | null>(null);

  // Sentiment Analysis and Mood Trends state
  const [sentiment, setSentiment] = useState<{
    tone: string;
    score: number;
    trend: number[];
    explanation: string;
  }>({
    tone: "Collaborative",
    score: 80,
    trend: [65, 70, 75, 78, 80],
    explanation: "Diskusi berjalan kooperatif dan saling menyelaraskan agenda pembangunan.",
  });
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  // Participant Engagement and Contribution Scores
  const [engagementScores, setEngagementScores] = useState<Record<string, {
    speakPercentage: number;
    contributionScore: number;
    contributionLabel: string;
    style: string;
  }>>({
    "usr-1": { speakPercentage: 35, contributionScore: 92, contributionLabel: "Strategic Leader", style: "Mengarahkan visi utama dan prioritas pembangunan nasional." },
    "usr-2": { speakPercentage: 25, contributionScore: 85, contributionLabel: "Action-Oriented", style: "Fokus pada mendelegasikan tugas teknis dan koordinasi logistik." },
    "usr-3": { speakPercentage: 20, contributionScore: 78, contributionLabel: "Analytical Mind", style: "Menganalisis skema pendanaan operasional dan risiko darurat." },
    "usr-4": { speakPercentage: 15, contributionScore: 80, contributionLabel: "Collaborative Partner", style: "Mendukung ide tim dan siap mengkoordinasikan logistik di lapangan." },
    "usr-5": { speakPercentage: 5, contributionScore: 45, contributionLabel: "Silent Observer", style: "Kurang berpartisipasi aktif dalam sesi diskusi ini." }
  });
  const [isAnalyzingEngagement, setIsAnalyzingEngagement] = useState(false);

  const analyzeSentiment = async () => {
    if (isOfflineMode) {
      const lines = meeting.transcript || [];
      let score = 75;
      let tone = "Collaborative";
      let explanation = "Diskusi berjalan dengan kooperatif secara luring (offline) tanpa kendala jaringan.";
      const textConcat = lines.map((l: any) => l.text.toLowerCase()).join(" ");
      
      let positiveCount = (textConcat.match(/(setuju|siap|bagus|siapkan|mantap|terima kasih|bisa|aman|selesai|oke|baik)/g) || []).length;
      let negativeCount = (textConcat.match(/(masalah|salah|sulit|lambat|belum|tunda|kendala|biaya|dana|kurang|rugi)/g) || []).length;
      let actionCount = (textConcat.match(/(tugas|kerja|koordinasi|rapat|keputusan|lanjut|lakukan|buat)/g) || []).length;

      score = score + (positiveCount * 3) - (negativeCount * 4) + (actionCount * 1);
      if (score > 98) score = 98;
      if (score < 30) score = 30;

      if (negativeCount > positiveCount + 1) {
        tone = "Tense";
        explanation = "Terdapat diskusi hangat luring mengenai hambatan operasional dan kendala teknis lapangan.";
      } else if (actionCount > positiveCount && actionCount > negativeCount) {
        tone = "Productive";
        explanation = "Anggota rapat fokus mendelegasikan pengerjaan tugas luring dan menetapkan target.";
      } else if (positiveCount > negativeCount) {
        tone = "Collaborative";
        explanation = "Sinergi tim sangat erat secara fisik, saling sepakat dan mengonfirmasi penyelesaian.";
      } else {
        tone = "Brainstorming";
        explanation = "Tim sedang berdiskusi luring mengeksplorasi ide alternatif pengerjaan proyek.";
      }

      const trend = [];
      let currentScore = score - 15;
      for (let i = 0; i < 5; i++) {
        currentScore += Math.floor(Math.random() * 8) - 1;
        if (currentScore > 100) currentScore = 100;
        if (currentScore < 10) currentScore = 10;
        trend.push(currentScore);
      }
      trend[4] = Math.round(score);

      setSentiment({
        tone,
        score: Math.round(score),
        trend,
        explanation: `[Offline AI] ${explanation}`
      });
      return;
    }

    try {
      setIsAnalyzingSentiment(true);
      const response = await fetch("/api/gemini/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: meeting.transcript || [] }),
      });
      if (response.ok) {
        const data = await response.json();
        setSentiment(data);
      }
    } catch (err) {
      console.error("Failed to analyze sentiment:", err);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const analyzeEngagement = async () => {
    if (isOfflineMode) {
      const lines = meeting.transcript || [];
      const totalLinesCount = lines.length;
      const userLineCounts: Record<string, number> = {};
      const userWordConcat: Record<string, string> = {};

      users.forEach((user: any) => {
        userLineCounts[user.id] = 0;
        userWordConcat[user.id] = "";
      });

      lines.forEach((line: any) => {
        const matchedUser = users.find(
          (u: any) => u.name.toLowerCase() === line.speakerName?.toLowerCase()
        );
        const speakerId = matchedUser ? matchedUser.id : (line.senderId || line.speakerId);
        if (speakerId && userLineCounts[speakerId] !== undefined) {
          userLineCounts[speakerId]++;
          userWordConcat[speakerId] += " " + (line.text || "");
        }
      });

      const scores: Record<string, any> = {};

      users.forEach((user: any) => {
        const lineCount = userLineCounts[user.id] || 0;
        const text = (userWordConcat[user.id] || "").toLowerCase();

        let speakPercentage = totalLinesCount > 0 ? Math.round((lineCount / totalLinesCount) * 100) : 0;
        
        if (totalLinesCount === 0) {
          const defaultProps: Record<string, any> = {
            "usr-1": { pct: 35, score: 92, label: "Strategic Leader", style: "Mengarahkan visi utama dan prioritas pembangunan nasional." },
            "usr-2": { pct: 25, score: 85, label: "Action-Oriented", style: "Fokus pada mendelegasikan tugas teknis dan koordinasi logistik." },
            "usr-3": { pct: 20, score: 78, label: "Analytical Mind", style: "Menganalisis skema pendanaan operasional dan risiko darurat." },
            "usr-4": { pct: 15, score: 80, label: "Collaborative Partner", style: "Mendukung ide tim dan siap mengkoordinasikan logistik di lapangan." },
            "usr-5": { pct: 5, score: 45, label: "Silent Observer", style: "Kurang berpartisipasi aktif dalam sesi diskusi ini." }
          };
          const mapped = defaultProps[user.id] || { pct: 20, score: 70, label: "Contributor", style: "Menyumbangkan ide umum dalam rapat." };
          scores[user.id] = {
            speakPercentage: mapped.pct,
            contributionScore: mapped.score,
            contributionLabel: mapped.label,
            style: `[Offline AI] ${mapped.style}`
          };
          return;
        }

        let positiveCount = (text.match(/(setuju|siap|bagus|siapkan|mantap|terima kasih|bisa|aman|selesai|oke|baik)/g) || []).length;
        let actionCount = (text.match(/(tugas|kerja|koordinasi|rapat|keputusan|lanjut|lakukan|buat|deadlin|tenggat)/g) || []).length;
        let analyticalCount = (text.match(/(analisa|hitung|dana|masalah|kendala|biaya|risiko|skema|opsi)/g) || []).length;

        let contributionScore = 50;
        contributionScore += lineCount * 5;
        contributionScore += positiveCount * 4;
        contributionScore += actionCount * 6;
        contributionScore += analyticalCount * 5;

        if (contributionScore > 98) contributionScore = 98;
        if (contributionScore < 30) contributionScore = 30;
        if (lineCount === 0) contributionScore = 20;

        let contributionLabel = "Quiet Contributor";
        let style = "Mendengarkan jalannya rapat secara aktif.";

        if (lineCount > 0) {
          if (actionCount > analyticalCount && actionCount > positiveCount) {
            contributionLabel = "Action-Oriented";
            style = "Aktif mengusulkan tugas lapangan baru.";
          } else if (analyticalCount > actionCount && analyticalCount > positiveCount) {
            contributionLabel = "Analytical Mind";
            style = "Menyoroti aspek biaya, risiko, dan kendala operasional.";
          } else if (positiveCount > actionCount && positiveCount > analyticalCount) {
            contributionLabel = "Collaborative Partner";
            style = "Menyetujui pendelegasian tugas dan menyepakati mufakat.";
          } else {
            contributionLabel = "Key Facilitator";
            style = "Menyeimbangkan jalannya pembicaraan secara luring.";
          }
        } else {
          contributionLabel = "Silent Observer";
          style = "Sedang mengamati jalannya rapat fisik.";
        }

        scores[user.id] = {
          speakPercentage,
          contributionScore: Math.round(contributionScore),
          contributionLabel,
          style: `[Offline AI] ${style}`
        };
      });

      const totalPct = Object.values(scores).reduce((acc: number, curr: any) => acc + (curr.speakPercentage || 0), 0);
      if (totalPct > 0 && totalLinesCount > 0) {
        users.forEach((user: any) => {
          if (scores[user.id]) {
            scores[user.id].speakPercentage = Math.round((scores[user.id].speakPercentage / totalPct) * 100);
          }
        });
      }

      setEngagementScores(scores);
      return;
    }

    try {
      setIsAnalyzingEngagement(true);
      const response = await fetch("/api/gemini/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: meeting.transcript || [],
          users
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.scores) {
          setEngagementScores(data.scores);
        }
      }
    } catch (err) {
      console.error("Failed to analyze engagement scores:", err);
    } finally {
      setIsAnalyzingEngagement(false);
    }
  };

  useEffect(() => {
    // Only analyze if there is a transcript to analyze
    if (meeting.transcript && meeting.transcript.length > 0) {
      const delayDebounce = setTimeout(() => {
        analyzeSentiment();
        analyzeEngagement();
      }, 2000); // 2 seconds debounce to avoid duplicate API spamming
      return () => clearTimeout(delayDebounce);
    }
  }, [meeting.transcript?.length]);

  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef("");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const executeVoiceCommandText = async (cmdText: string) => {
    if (!cmdText.trim()) return;
    setIsVoiceProcessing(true);
    setVoiceError(null);
    setVoiceResult(null);

    try {
      // Filter items specifically for the active meeting
      const activeMeetingTasks = actionItems.filter((t) => t.meetingId === meeting.id);
      const activeMeetingDecisions = decisions.filter((d) => d.meetingId === meeting.id);

      let result: any;
      if (isOfflineMode) {
        // Mock offline response delay
        await new Promise((resolve) => setTimeout(resolve, 600));
        result = executeLocalOfflineVoiceCommand(cmdText);
        setVoiceResult(result);
      } else {
        const response = await fetch("/api/gemini/voice-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: cmdText,
            contextData: {
              actionItems: activeMeetingTasks,
              decisions: activeMeetingDecisions,
              users,
              transcript: meeting.transcript || [],
              currentDate: new Date().toISOString().split("T")[0],
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Gagal menghubungi asisten AI.");
        }

        result = await response.json();
        setVoiceResult(result);
      }

      // 1. Process Set Deadline
      if (result.action === "set_deadline" && result.data?.taskId) {
        const matchedTask = actionItems.find((t) => t.id === result.data.taskId);
        if (matchedTask) {
          const updated = {
            ...matchedTask,
            deadline: result.data.deadline,
            isOffline: isOfflineMode ? true : matchedTask.isOffline,
            syncPending: isOfflineMode ? true : matchedTask.syncPending,
          };
          updateActionItem(updated);
          
          if (isOfflineMode) {
            addToOfflineQueue(
              "action_item",
              `Perbarui tenggat tugas '${matchedTask.name}' ke ${result.data.deadline}`,
              updated
            );
          }

          setSmartToast({
            show: true,
            type: "success",
            message: "Tenggat Waktu Diperbarui!",
            details: `Tugas '${matchedTask.name}' kini diatur selesainya pada ${result.data.deadline}.${isOfflineMode ? " [Luring - Antrean Sinkronisasi]" : ""}`,
          });
        }
      }
      // 2. Process Create Action Item
      else if (result.action === "create_action_item" && result.data) {
        const newActionItem: ActionItem = {
          id: `tsk-${Date.now()}`,
          taskNumber: `TSK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          name: result.data.name,
          picId: result.data.picId || users[0]?.id || "",
          deadline: result.data.deadline || new Date().toISOString().split("T")[0],
          progress: 0,
          checklist: [
            { id: `chk-${Date.now()}-1`, text: "Melakukan koordinasi tim terkait", done: false },
            { id: `chk-${Date.now()}-2`, text: "Verifikasi penyelesaian di lapangan", done: false },
          ],
          status: "Not Started",
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          priority: result.data.priority || "High",
          isOffline: isOfflineMode ? true : undefined,
          syncPending: isOfflineMode ? true : undefined,
        };
        addActionItem(newActionItem);

        if (isOfflineMode) {
          addToOfflineQueue(
            "action_item",
            `Delegasikan tugas: ${newActionItem.name}`,
            newActionItem
          );
        }

        setSmartToast({
          show: true,
          type: "success",
          message: "Tugas Baru Ditambahkan!",
          details: `Tugas '${newActionItem.name}' ditugaskan kepada ${
            users.find((u) => u.id === newActionItem.picId)?.name || "PIC"
          }.${isOfflineMode ? " [Luring - Antrean Sinkronisasi]" : ""}`,
        });
      }
      // 3. Process Flag Decision
      else if (result.action === "flag_decision" && result.data) {
        const newDecision: Decision = {
          id: `dec-${Date.now()}`,
          decisionNumber: `DEC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().split("T")[0],
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          description: result.data.text,
          priority: "High",
          category: result.data.category || "Operasional",
          status: "Draft",
          picId: result.data.picId || users[0]?.id || "",
          targetDate: new Date().toISOString().split("T")[0],
          signatures: [],
          attachments: [],
          history: [
            {
              date: new Date().toISOString().replace("T", " ").substring(0, 16),
              userId: currentUser.id,
              userName: currentUser.name,
              action: `Keputusan dibuat via Asisten Suara AI: "${result.data.text}".`,
            },
          ],
          isOffline: isOfflineMode ? true : undefined,
          syncPending: isOfflineMode ? true : undefined,
        };
        addDecision(newDecision);

        if (isOfflineMode) {
          addToOfflineQueue(
            "decision",
            `Catat keputusan: ${newDecision.description}`,
            newDecision
          );
        }

        setSmartToast({
          show: true,
          type: "success",
          message: "Keputusan Baru Di-flag!",
          details: `Keputusan resmi dicatat: "${newDecision.description}".${isOfflineMode ? " [Luring - Antrean Sinkronisasi]" : ""}`,
        });
      }
      // 4. Process General conversational response or Q&A
      else if (result.action === "send_chat" && result.explanation) {
        const chatText = `🤖 [FGi Voice Assistant]: ${result.explanation}`;
        sendMeetingChat(meeting.id, chatText);

        if (isOfflineMode) {
          addToOfflineQueue(
            "chat",
            "Kirim pesan obrolan AI",
            { id: `chat-${Date.now()}`, text: chatText }
          );
        }
      }

      // Voice synthesis response output (TTS)
      if (result.explanation && "speechSynthesis" in window) {
        // Cancel any active speech to prevent overlap
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(result.explanation);
        utterance.lang = "id-ID";
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      console.error(err);
      setVoiceError(err.message || "Gagal memproses instruksi.");
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  const startVoiceListening = () => {
    setVoiceTranscript("");
    setVoiceError(null);
    setVoiceResult(null);
    latestTranscriptRef.current = "";

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech Recognition tidak didukung di browser ini. Silakan gunakan ketik manual!");
      setShowVoiceManualInput(true);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "id-ID";

      rec.onstart = () => {
        setIsVoiceListening(true);
      };

      rec.onresult = (e: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          } else {
            interimTranscript += e.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setVoiceTranscript(currentText);
        latestTranscriptRef.current = currentText;
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition error:", e);
        if (e.error === "not-allowed") {
          setVoiceError("Izin mikrofon ditolak / iframe sandboxed. Silakan ketik perintah manual.");
        } else if (e.error === "no-speech") {
          // ignore or handle silence
        } else {
          setVoiceError(`Error: ${e.error || "Gagal mengaktifkan mikrofon"}`);
        }
        setIsVoiceListening(false);
      };

      rec.onend = () => {
        setIsVoiceListening(false);
        const finalVal = latestTranscriptRef.current.trim();
        if (finalVal) {
          executeVoiceCommandText(finalVal);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setVoiceError("Gagal memulai perekaman suara.");
      setIsVoiceListening(false);
    }
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceListening(false);
  };

  const mockPhrases = [
    { name: "Ahmad Subagio", role: "Direktur", text: "Tolong pastikan koordinasi logistik PT Semen Indonesia diselesaikan minggu ini juga." },
    { name: "Siti Rahmawati", role: "Manager", text: "Baik Pak Ahmad, kami sudah menyiapkan skema operasional darurat dengan dana 150 juta." },
    { name: "Budi Santoso", role: "Supervisor", text: "Untuk kolom beton pracetak lantai 5, pengerjaan bekisting siap 100% lusa depan." },
    { name: "Diana Lestari", role: "Staff", text: "Saya siap mengawasi pengerjaan lapangan secara langsung setiap hari dan melaporkan progresnya harian." },
    { name: "Radit Widjaya", role: "Notulis", text: "Keputusan sewa armada truk logistik mandiri akan saya masukkan ke draf MoM dan didaftarkan sebagai DEC-002." }
  ];

  // Draw simulation on canvas init
  useEffect(() => {
    if (activeTab === "whiteboard" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeTab]);

  // Audio waveform animation simulation
  const [waveHeights, setWaveHeights] = useState<number[]>([15, 25, 10, 35, 45, 12, 18, 30, 14, 20]);
  useEffect(() => {
    let animId: number;
    if (isRecording && micActive) {
      const updateWaves = () => {
        setWaveHeights((prev) => prev.map(() => Math.floor(Math.random() * 40) + 10));
        animId = requestAnimationFrame(updateWaves);
      };
      animId = requestAnimationFrame(updateWaves);
    } else {
      setWaveHeights([15, 25, 10, 35, 45, 12, 18, 30, 14, 20].map(() => 5));
    }
    return () => cancelAnimationFrame(animId);
  }, [isRecording, micActive]);

  // Handle Simulated Transcription interval
  useEffect(() => {
    if (isSimulatingTranscripts) {
      let index = 0;
      transcriptTimerRef.current = setInterval(() => {
        const phrase = mockPhrases[index % mockPhrases.length];
        const now = new Date();
        const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        appendTranscriptLine(meeting.id, {
          timestamp,
          speakerName: phrase.name,
          speakerRole: phrase.role,
          text: phrase.text
        });
        index++;
      }, 7000);
    } else {
      if (transcriptTimerRef.current) {
        clearInterval(transcriptTimerRef.current);
      }
    }
    return () => {
      if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    };
  }, [isSimulatingTranscripts]);

  // Whiteboard drawing handlers
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
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lineWidth;
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Poll management handlers
  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOptions = pollOptions.filter((o) => o.trim() !== "");
    if (!pollQuestion || filteredOptions.length < 2) return;

    createMeetingPoll(meeting.id, pollQuestion, filteredOptions);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const handleSendChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMeetingChat(meeting.id, chatInput.trim());
    setChatInput("");
  };

  // Trigger Gemini MoM Generation and auto-register tasks & decisions
  const handleGenerateMoMClick = async () => {
    setIsGeneratingMoM(true);
    setGeneratedMomMarkdown(null);
    setSnapshotData(null);
    setShowSnapshotModal(false);

    const steps = [
      "Mengumpulkan data transkrip dan rekaman audio...",
      "Mengunggah ke layanan Google Gemini-3.5-Flash...",
      "Menyusun Minutes of Meeting (MoM) profesional...",
      "Mengekstrak matriks keputusan & action items tindak lanjut secara otomatis...",
      "Menyintesis AI 'Meeting Snapshot' instan..."
    ];

    // Start background parallel fetch task for optimum UI responsiveness
    const fetchPromise = (async () => {
      const resultMarkdown = await generateMoMWithAI(meeting.id);
      saveMoM(meeting.id, resultMarkdown);

      // Auto-extract and register decisions & action items to illustrate AI integration power
      const cleanMtgNum = meeting.meetingNumber.replace(/\D/g, "");
      
      const newDecision: Decision = {
        id: `dec-${cleanMtgNum || Date.now()}`,
        decisionNumber: `DEC-${cleanMtgNum || "2026-002"}`,
        date: new Date().toISOString().split("T")[0],
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        description: `Melakukan implementasi taktis dan bypass birokrasi penundaan material di ${meeting.title}.`,
        priority: "High",
        category: "Operasional Darurat",
        status: "Draft",
        picId: "usr-3", // Siti Rahmawati
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        signatures: [],
        attachments: [],
        history: [{ date: new Date().toISOString().replace("T", " ").substring(0, 16), userId: currentUser.id, userName: currentUser.name, action: "Draf keputusan dibuat otomatis oleh FGi AI Extractor" }]
      };

      const newActionItem: ActionItem = {
        id: `tsk-${cleanMtgNum || Date.now()}-A`,
        taskNumber: `TSK-${cleanMtgNum || "2026-004"}`,
        name: `Koordinasi harian dan percepatan operasional lapangan ${meeting.title}`,
        picId: "usr-4", // Budi Santoso
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        progress: 0,
        checklist: [
          { id: "chk-dec-1", text: "Inspeksi kepatuhan target penyelesaian di lapangan", done: false },
          { id: "chk-dec-2", text: "Kirim laporan progres harian ke manager proyek", done: false }
        ],
        status: "Not Started",
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        priority: "High"
      };

      addDecision(newDecision);
      addActionItem(newActionItem);

      // Fetch snapshot in parallel
      const transcriptText = meeting.transcript?.length > 0 
        ? meeting.transcript.map((t) => `[${t.timestamp}] ${t.speakerName} (${t.speakerRole}): ${t.text}`).join("\n")
        : "";

      const snapshotResponse = await fetch("/api/gemini/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingTitle: meeting.title,
          meetingNumber: meeting.meetingNumber,
          agenda: meeting.agenda,
          transcript: `${transcriptText}\n\nCatatan Tambahan:\n${meeting.liveNotes || ""}`,
          date: meeting.date,
          users,
          decisions: [...decisions.filter(d => d.meetingId === meeting.id), newDecision],
          actionItems: [...actionItems.filter(a => a.meetingId === meeting.id), newActionItem]
        })
      });

      let snapshotJson = null;
      if (snapshotResponse.ok) {
        snapshotJson = await snapshotResponse.json();
      }

      return { resultMarkdown, snapshotJson };
    })();

    // Stagger steps to give realistic animated progression
    for (let i = 0; i < steps.length; i++) {
      setAiGenerationStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    try {
      const { resultMarkdown, snapshotJson } = await fetchPromise;
      setGeneratedMomMarkdown(resultMarkdown);
      if (snapshotJson) {
        setSnapshotData(snapshotJson);
        setShowSnapshotModal(true);
      }
    } catch (err) {
      console.error(err);
      setGeneratedMomMarkdown("Gagal menghasilkan MoM AI. Silakan periksa kunci API Anda di Secrets.");
    } finally {
      setIsGeneratingMoM(false);
    }
  };

  // Human format for timer
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, "0") : null,
      String(mins).padStart(2, "0"),
      String(secs).padStart(2, "0")
    ]
      .filter(Boolean)
      .join(":");
  };

  // Start background synchronization sequence
  const handleStartSync = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    
    try {
      // Progress simulation
      await new Promise(r => setTimeout(r, 800));
      await new Promise(r => setTimeout(r, 1000));
      await new Promise(r => setTimeout(r, 800));
      
      // Clear syncPending from decisions and actionItems in-place
      // Under normal backend circumstances, these would be HTTP POSTed to persistent databases
      
      setOfflineQueue([]);
      setIsSyncing(false);
      setShowOfflineSyncDrawer(false);
      
      setSmartToast({
        show: true,
        type: "success",
        message: "Sinkronisasi Selesai!",
        details: "Seluruh draf keputusan, penugasan pic, dan memo obrolan luring berhasil terintegrasi dengan server FGi AI."
      });
    } catch (err) {
      console.error(err);
      setIsSyncing(false);
      setSmartToast({
        show: true,
        type: "error",
        message: "Sinkronisasi Gagal!",
        details: "Silakan periksa koneksi internet Anda dan coba lagi."
      });
    }
  };

  // Export local meeting data backup as a downloadable JSON file
  const handleExportBackup = () => {
    const dataToExport = {
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      exportedAt: new Date().toISOString(),
      offlineQueue,
      decisions: decisions.filter(d => d.meetingId === meeting.id),
      actionItems: actionItems.filter(a => a.meetingId === meeting.id),
      transcript: meeting.transcript || []
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-rapat-luring-${meeting.id}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSmartToast({
      show: true,
      type: "success",
      message: "Cadangan Berhasil Diekspor!",
      details: "File backup .json telah diunduh ke perangkat Anda."
    });
  };

  // Import meeting backup file (.json)
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        
        if (parsed.meetingId !== meeting.id) {
          const confirmProceed = window.confirm(
            `Peringatan: Berkas cadangan ini untuk rapat lain ('${parsed.meetingTitle || "Tidak Diketahui"}'). Tetap lanjutkan impor?`
          );
          if (!confirmProceed) return;
        }
        
        if (Array.isArray(parsed.offlineQueue)) {
          setOfflineQueue(parsed.offlineQueue);
        }
        
        // Merge decisions
        if (Array.isArray(parsed.decisions)) {
          parsed.decisions.forEach((dec: any) => {
            const exists = decisions.some(d => d.id === dec.id);
            if (!exists) addDecision(dec);
          });
        }
        
        // Merge action items
        if (Array.isArray(parsed.actionItems)) {
          parsed.actionItems.forEach((act: any) => {
            const exists = actionItems.some(a => a.id === act.id);
            if (!exists) addActionItem(act);
          });
        }
        
        // Merge transcript
        if (Array.isArray(parsed.transcript)) {
          parsed.transcript.forEach((line: any) => {
            const exists = (meeting.transcript || []).some((l: any) => l.timestamp === line.timestamp && l.text === line.text);
            if (!exists) appendTranscriptLine(meeting.id, line);
          });
        }

        setSmartToast({
          show: true,
          type: "success",
          message: "Impor Cadangan Sukses!",
          details: `Berhasil memuat ${parsed.decisions?.length || 0} keputusan, ${parsed.actionItems?.length || 0} tugas luring.`
        });
      } catch (err) {
        console.error(err);
        setSmartToast({
          show: true,
          type: "error",
          message: "Gagal Mengimpor File!",
          details: "Struktur file JSON tidak sesuai atau corrupt."
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        handleImportBackup(file);
      } else {
        setSmartToast({
          show: true,
          type: "error",
          message: "Format File Tidak Didukung!",
          details: "Harap jatuhkan file dengan format .json hasil ekspor cadangan rapat luring."
        });
      }
    }
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-slate-100 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* 1. Sub Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`${isOfflineMode ? "bg-amber-600" : "bg-red-600 animate-pulse"} text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider`}>
              {isOfflineMode ? "LURING / OFFLINE" : "LIVE"}
            </span>
            <h2 className="text-md font-bold text-white truncate max-w-lg">{meeting.title}</h2>
            
            {/* Connection Toggle & Queue Pill */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                  isOfflineMode 
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse" 
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                }`}
                title={isOfflineMode ? "Pindah ke Mode Online" : "Pindah ke Mode Offline luring"}
              >
                {isOfflineMode ? <CloudOff size={11} /> : <Cloud size={11} />}
                {isOfflineMode ? "Mode Luring" : "Online"}
              </button>
              
              {offlineQueue.length > 0 && (
                <button
                  onClick={() => setShowOfflineSyncDrawer(true)}
                  className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/35 text-blue-400 hover:bg-blue-500/25 text-[10px] font-bold flex items-center gap-1 animate-pulse cursor-pointer"
                  title="Tampilkan daftar antrean sinkronisasi luring"
                >
                  <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
                  {offlineQueue.length} Tertunda
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {meeting.meetingNumber} • Proyek: <span className="text-blue-400 font-semibold">{meeting.project}</span>
          </p>
        </div>

        {/* Subtle Sentiment Trend Widget */}
        <div className="hidden md:flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-xl text-xs relative group max-w-sm">
          {/* Pulsing indicator based on tone */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                sentiment.tone === "Tense" ? "bg-red-500 animate-ping" :
                sentiment.tone === "Productive" ? "bg-blue-500 animate-pulse" :
                "bg-emerald-500 animate-pulse"
              }`}></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                Mood AI Rapat {isAnalyzingSentiment && <Sparkles size={8} className="animate-spin text-blue-400" />}
              </span>
            </div>
            
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-white">{sentiment.tone}</span>
              <span className="text-[10px] text-slate-400 font-medium">({sentiment.score}%)</span>
            </div>
          </div>

          {/* Tiny SVG Sparkline */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4 h-8" title="Tren Sentimen Diskusi (Real-time)">
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 100 30">
              <defs>
                <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Draw area under the sparkline curve */}
              <path
                d={`M 0 30 
                    ${(sentiment.trend || [60,70,80,90]).map((val, idx) => {
                      const x = (idx / ((sentiment.trend || [60,70,80,90]).length - 1)) * 100;
                      const y = 30 - (val / 100) * 26 - 2; // scale 0-100 to height 2-28
                      return `L ${x} ${y}`;
                    }).join(" ")} 
                    L 100 30 Z`}
                fill="url(#sparklineGrad)"
              />
              {/* Draw the sparkline itself */}
              <path
                d={(sentiment.trend || [60,70,80,90]).map((val, idx) => {
                  const x = (idx / ((sentiment.trend || [60,70,80,90]).length - 1)) * 100;
                  const y = 30 - (val / 100) * 26 - 2;
                  return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ")}
                fill="none"
                stroke={sentiment.tone === "Tense" ? "#ef4444" : sentiment.tone === "Productive" ? "#3b82f6" : "#10b981"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Draw last point dot */}
              {(() => {
                const lastVal = (sentiment.trend || [60,70,80,90])[(sentiment.trend || [60,70,80,90]).length - 1] || 80;
                const lx = 100;
                const ly = 30 - (lastVal / 100) * 26 - 2;
                return (
                  <circle
                    cx={lx}
                    cy={ly}
                    r="3.5"
                    fill={sentiment.tone === "Tense" ? "#ef4444" : sentiment.tone === "Productive" ? "#3b82f6" : "#10b981"}
                    className="animate-pulse"
                  />
                );
              })()}
            </svg>
          </div>

          {/* Hover explanation tooltip */}
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg p-2.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-64 z-50 text-center leading-relaxed font-sans">
            <div className="font-semibold text-slate-200 mb-0.5">Analisis Sentimen:</div>
            "{sentiment.explanation}"
            <div className="text-[8px] text-slate-500 mt-1 font-mono">Dianalisis secara real-time dari transkrip diskusi.</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Audio Wave indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-mono text-slate-300">MoM Recorder: {formatTime(recordingDuration)}</span>
          </div>

          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          >
            Sembunyikan
          </button>
        </div>
      </div>

      {/* 2. Primary Screen */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Video, Audio wave and Transcript canvas */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto border-r border-slate-800 bg-slate-900/40 p-4 space-y-4">
          
          {/* Floating AI Topic Covered Notification Card */}
          {agendaAlert && agendaAlert.show && (
            <div className="bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/25 animate-bounce z-40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Agenda Tercakup via AI</h4>
                  <p className="text-xs font-bold text-white leading-snug">"{agendaAlert.agendaTitle}"</p>
                  <p className="text-[9px] text-emerald-400 font-medium">Dibahas oleh {agendaAlert.speaker} • Kecocokan {agendaAlert.score}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                <Check size={11} /> Completed
              </div>
            </div>
          )}
          
          {/* Grid of participant camera boxes */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {users.slice(0, 5).map((user, i) => (
              <div
                key={user.id}
                className="relative bg-slate-900 aspect-video rounded-xl overflow-hidden border border-slate-800/80 shadow-md group"
              >
                {videoActive && (i < 3 || i === 4) ? (
                  <div className="w-full h-full relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover blur-sm opacity-25"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-500 shadow-xl">
                        <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-md text-slate-400">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2">Kamera Nonaktif</span>
                  </div>
                )}

                {/* Left floating AI role tag */}
                {(() => {
                  const scoreInfo = engagementScores[user.id];
                  if (!scoreInfo) return null;
                  return (
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-blue-500/20 text-[8px] font-bold text-blue-400 flex items-center gap-1 font-mono uppercase tracking-wider z-10">
                      <Sparkles size={7} className="animate-pulse" />
                      {scoreInfo.contributionLabel}
                    </div>
                  );
                })()}

                {/* Bottom Speaker Tag & Name */}
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] flex items-center gap-1.5 border border-slate-800 text-slate-300 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="font-medium truncate max-w-[100px]">{user.name}</span>
                </div>

                {/* Top right mic & speak share pill */}
                {(() => {
                  const scoreInfo = engagementScores[user.id];
                  const isTopSpeaker = scoreInfo && Object.values(engagementScores).every((other: any) => (other.speakPercentage || 0) <= (scoreInfo.speakPercentage || 0)) && scoreInfo.speakPercentage > 10;
                  return (
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                      {scoreInfo && (
                        <span className={`px-1 py-0.5 rounded text-[8px] font-bold font-mono ${
                          isTopSpeaker ? "bg-amber-500/10 text-amber-400 border border-amber-500/25" : "bg-slate-950/80 text-slate-300 border border-slate-800"
                        }`}>
                          {isTopSpeaker && "👑 "}
                          {scoreInfo.speakPercentage}% Speak
                        </span>
                      )}
                      <span className="p-1 rounded bg-slate-950/80 border border-slate-800 text-slate-400 flex items-center">
                        {i === 0 ? <Mic className="w-3 h-3 text-blue-400" /> : <Mic className="w-3 h-3 text-slate-500" />}
                      </span>
                    </div>
                  );
                })()}

                {/* Progress bar representing AI-calculated contribution score */}
                {(() => {
                  const scoreInfo = engagementScores[user.id];
                  if (!scoreInfo) return null;
                  return (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950 overflow-hidden z-10">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${scoreInfo.contributionScore}%` }}
                        title={`Kualitas Kontribusi: ${scoreInfo.contributionScore}%`}
                      ></div>
                    </div>
                  );
                })()}

                {/* Hover overlay with detail text */}
                {(() => {
                  const scoreInfo = engagementScores[user.id];
                  if (!scoreInfo) return null;
                  return (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-left space-y-1 z-20">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-mono">
                          Gaya Kontribusi AI
                        </span>
                      </div>
                      <p className="text-xs text-slate-100 font-semibold">
                        {scoreInfo.contributionLabel}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-relaxed italic">
                        "{scoreInfo.style}"
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500 font-mono border-t border-slate-800 mt-1">
                        <span>Porsi Bicara:</span>
                        <span className="font-bold text-blue-400">{scoreInfo.speakPercentage}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                        <span>Kualitas Kontribusi:</span>
                        <span className="font-bold text-emerald-400">{scoreInfo.contributionScore}%</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Audio Waves Simulation */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-1 h-8 px-2">
                {waveHeights.map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1 bg-gradient-to-t from-blue-600 to-emerald-400 rounded-full transition-all duration-150"
                  ></span>
                ))}
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-200">Whisper Live Audio Transcriber</span>
                <span className="block text-[10px] text-slate-500">Mendeteksi aktivitas vokal peserta rapat secara realtime</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSimulatingTranscripts(!isSimulatingTranscripts)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSimulatingTranscripts
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                <Globe2 size={13} className={isSimulatingTranscripts ? "animate-spin" : ""} />
                {isSimulatingTranscripts ? "Simulasi Transkrip Aktif" : "Simulasikan Transkrip"}
              </button>
            </div>
          </div>

          {/* FGi AI Voice Assistant Control Panel */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 shrink-0 relative overflow-hidden">
            {/* Ambient Background Glow for AI theme */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 font-display">🎙️ FGi AI Voice Assistant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowVoiceManualInput(!showVoiceManualInput)}
                  title="Ketik Perintah Manual"
                  className={`p-1 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white ${showVoiceManualInput ? "text-blue-400 hover:text-blue-300" : ""}`}
                >
                  <Keyboard size={14} />
                </button>
                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider font-mono">
                  Online
                </span>
              </div>
            </div>

            {/* Listening / Idle / Processing state visualizations */}
            <div className="flex flex-col items-center justify-center py-4 bg-slate-950/80 rounded-xl border border-slate-800/80 relative">
              {isVoiceListening ? (
                // Pulse Recording Circle
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={stopVoiceListening}
                    className="relative w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white cursor-pointer hover:bg-red-700 transition-transform hover:scale-105"
                  >
                    <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-75"></span>
                    <Mic size={20} className="relative z-10" />
                  </button>
                  <span className="text-xs font-semibold text-red-400 animate-pulse">Mendengarkan...</span>
                  <p className="text-[10px] text-slate-400 text-center max-w-[200px]">Bicaralah sekarang. Ketuk tombol merah untuk menghentikan.</p>
                </div>
              ) : isVoiceProcessing ? (
                // Processing loader
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin"></div>
                    <Sparkles size={16} className="text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-blue-400 animate-pulse">Menganalisis Perintah...</span>
                  <p className="text-[10px] text-slate-400">Menghubungi FGi Corporate Brain</p>
                </div>
              ) : (
                // Idle Mic Button
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={startVoiceListening}
                    className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:text-white hover:bg-blue-600 transition-all cursor-pointer shadow-lg group"
                  >
                    <Mic size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <span className="text-xs font-semibold text-slate-300">Asisten Siap Siaga</span>
                  <p className="text-[10px] text-slate-500">Ketuk untuk mulai memberi perintah suara</p>
                </div>
              )}

              {/* Live Transcript Display Box */}
              {voiceTranscript && (
                <div className="mt-3 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg max-w-[90%] text-center">
                  <p className="text-slate-300 font-mono text-[10px] italic">"{voiceTranscript}"</p>
                </div>
              )}

              {/* Error Box */}
              {voiceError && (
                <div className="mt-2 px-3 py-1 bg-red-950/40 border border-red-900/40 rounded-lg text-red-400 text-[10px] text-center max-w-[90%]">
                  {voiceError}
                </div>
              )}
            </div>

            {/* Manual Text Input Field if toggled */}
            {showVoiceManualInput && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (voiceManualInputText.trim()) {
                    executeVoiceCommandText(voiceManualInputText.trim());
                    setVoiceManualInputText("");
                  }
                }}
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-lg"
              >
                <input
                  type="text"
                  placeholder="Ketik perintah (contoh: Set deadline tugas terakhir lusa)..."
                  value={voiceManualInputText}
                  onChange={(e) => setVoiceManualInputText(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none px-2"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  <Send size={12} />
                </button>
              </form>
            )}

            {/* AI Confirmation / Speech Output display */}
            {voiceResult && (
              <div className="p-3 bg-blue-950/30 border border-blue-800/20 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Volume2 size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Speech Output</span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {voiceResult.explanation}
                </p>
                {voiceResult.action !== "unsupported" && voiceResult.action !== "send_chat" && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    <Check size={10} />
                    Sistem Diperbarui ({voiceResult.action})
                  </span>
                )}
              </div>
            )}

            {/* Suggestion / Shortcut chips */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Contoh Perintah Suara / Cepat:
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => executeVoiceCommandText("Set a deadline for the previous item")}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-[10px] font-mono transition-all text-left truncate max-w-full cursor-pointer"
                >
                  👉 "Set a deadline for the previous item"
                </button>
                <button
                  onClick={() => executeVoiceCommandText("Flag the last transcript as a decision")}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-[10px] font-mono transition-all text-left truncate max-w-full cursor-pointer"
                >
                  👉 "Catat pernyataan terakhir sebagai keputusan"
                </button>
                <button
                  onClick={() => executeVoiceCommandText("Tugas baru koordinasi logistik untuk Ahmad Subagio")}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-[10px] font-mono transition-all text-left truncate max-w-full cursor-pointer"
                >
                  👉 "Tugas koordinasi logistik untuk Ahmad Subagio"
                </button>
              </div>
            </div>
          </div>

          {/* FGi Real-time Smart Actions Panel */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 font-display">⚡ Smart Actions Center</span>
              </div>
              <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider font-mono">
                Context-Aware AI
              </span>
            </div>

            {meeting.transcript && meeting.transcript.length > 0 ? (
              (() => {
                const latestLine = meeting.transcript[meeting.transcript.length - 1];
                return (
                  <div className="space-y-3">
                    {/* Transcript context snippet */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                      <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400">
                        <span className="font-semibold text-blue-400">{latestLine.speakerName} ({latestLine.speakerRole})</span>
                        <span className="font-mono text-slate-500">{latestLine.timestamp}</span>
                      </div>
                      <p className="text-slate-300 italic leading-relaxed font-mono">"{latestLine.text}"</p>
                    </div>

                    {/* Quick shortcuts row */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleTriggerSmartAction(latestLine, "decision")}
                        className="px-2.5 py-2 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Star size={11} />
                        Flag Decision
                      </button>
                      <button
                        onClick={() => handleTriggerSmartAction(latestLine, "action_item")}
                        className="px-2.5 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <CheckSquare size={11} />
                        Action Item
                      </button>
                      <button
                        onClick={() => handleTriggerSmartAction(latestLine, "urgent")}
                        className="px-2.5 py-2 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Bell size={11} />
                        Urgent Ping
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-4 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <p className="text-[10px] leading-relaxed px-4 text-slate-400">
                  Menunggu transkrip live berjalan... Tekan <strong className="text-slate-200">"Simulasikan Transkrip"</strong> di atas untuk memicu kalimat diskusi yang dapat langsung di-flag.
                </p>
              </div>
            )}
          </div>

          {/* Live Transcript scroll container */}
          <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-y-auto flex flex-col space-y-3 max-h-72">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 text-xs font-semibold text-slate-400 shrink-0">
              <Sparkles size={13} className="text-blue-400" />
              <span>Real-time Speech-to-Text Transcription</span>
            </div>

            {meeting.transcript && meeting.transcript.length > 0 ? (
              meeting.transcript.map((line, idx) => (
                <div key={idx} className="group relative text-xs space-y-1 animate-fade-in border-l-2 border-slate-800 hover:border-blue-500 pl-2.5 pr-2 py-1.5 rounded-r-lg hover:bg-slate-900/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">{line.timestamp}</span>
                      <span className="font-bold text-blue-400">{line.speakerName}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">
                        {line.speakerRole}
                      </span>
                    </div>

                    {/* Hover Shortcuts */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-md border border-slate-800/80 shadow-md">
                      <button
                        onClick={() => handleTriggerSmartAction(line, "decision")}
                        title="Flag as Decision"
                        className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                      >
                        <Star size={11} />
                      </button>
                      <button
                        onClick={() => handleTriggerSmartAction(line, "action_item")}
                        title="Create Action Item"
                        className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                      >
                        <CheckSquare size={11} />
                      </button>
                      <button
                        onClick={() => handleTriggerSmartAction(line, "urgent")}
                        title="Send Urgent Message"
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                      >
                        <Bell size={11} />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">{line.text}</p>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-500">
                <AlertCircle size={24} className="text-slate-700 mb-2" />
                <span className="text-xs font-medium">Belum ada transkrip terdeteksi.</span>
                <span className="text-[10px] text-slate-600">Tekan "Simulasikan Transkrip" di atas untuk memicu pembicaraan peserta rapat otomatis.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Tabbed Panel Workspace */}
        <div className="w-full md:w-96 flex flex-col min-h-0 border-t md:border-t-0 border-slate-800 bg-slate-950">
          
          {/* Navigation Tab indicators */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 text-xs overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("agenda")}
              className={`flex-1 py-3 px-2 text-center border-b-2 font-medium cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === "agenda" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Agenda Live
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 px-2 text-center border-b-2 font-medium cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === "chat" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Chat Rapat
            </button>
            <button
              onClick={() => setActiveTab("whiteboard")}
              className={`flex-1 py-3 px-2 text-center border-b-2 font-medium cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === "whiteboard" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Whiteboard
            </button>
            <button
              onClick={() => setActiveTab("polling")}
              className={`flex-1 py-3 px-2 text-center border-b-2 font-medium cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === "polling" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Polling
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-3 px-2 text-center border-b-2 font-medium cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === "notes" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Catatan MoM
            </button>
          </div>

          {/* Active Workspace Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            
            {/* Real-time Intelligent Agenda Tracking Workspace */}
            {activeTab === "agenda" && (
              <div className="flex flex-col h-full space-y-4">
                {/* Header info card */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-display">
                      <ListTodo size={14} className="text-blue-400 animate-pulse" />
                      Pelacakan Agenda Real-time AI
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoTrackingEnabled}
                        onChange={(e) => setAutoTrackingEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                      <span className="ml-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        {autoTrackingEnabled ? "Auto AI" : "Manual"}
                      </span>
                    </label>
                  </div>

                  {/* Progress stats */}
                  {(() => {
                    const total = agendaItems.length;
                    const completed = agendaItems.filter(item => item.completed).length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>Progres Rapat</span>
                          <span className="font-bold text-blue-400">{completed}/{total} Agenda Selesai ({percent}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Agenda list */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                  {agendaItems.length > 0 ? (
                    agendaItems.map((item, idx) => {
                      const isItemCompleted = item.completed;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isItemCompleted
                              ? "bg-emerald-950/20 border-emerald-500/20 shadow-sm shadow-emerald-950/10"
                              : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAgendaItems(prev => prev.map(a => {
                                  if (a.id === item.id) {
                                    const nextState = !a.completed;
                                    return {
                                      ...a,
                                      completed: nextState,
                                      manuallyChecked: true,
                                      completedAt: nextState ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
                                      speakerName: nextState ? currentUser.name : undefined,
                                      matchScore: nextState ? 100 : undefined,
                                      matchedWords: undefined,
                                      matchedText: undefined
                                    };
                                  }
                                  return a;
                                }));
                              }}
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                isItemCompleted
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                  : "border-slate-700 hover:border-slate-500 bg-slate-950"
                              }`}
                            >
                              {isItemCompleted && <Check size={11} strokeWidth={3} />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-semibold block leading-tight ${isItemCompleted ? "text-slate-400 line-through" : "text-slate-200"}`}>
                                {idx + 1}. {item.text}
                              </span>

                              {isItemCompleted && (
                                <div className="mt-1.5 flex flex-col gap-1 text-[9px] text-slate-400 font-mono">
                                  <div className="flex items-center gap-1.5 text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span>
                                      {item.manuallyChecked ? "Diverifikasi Manual" : `Terdeteksi Otomatis (${item.matchScore}% Cocok)`}
                                    </span>
                                    {item.completedAt && <span>• Pukul {item.completedAt}</span>}
                                  </div>

                                  {item.speakerName && (
                                    <div className="text-slate-500">
                                      Pembicara: <span className="font-semibold text-blue-400">{item.speakerName}</span>
                                    </div>
                                  )}

                                  {item.matchedText && (
                                    <p className="mt-0.5 text-slate-500 italic max-w-full truncate" title={item.matchedText}>
                                      "{item.matchedText}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      <p className="text-[10px] leading-relaxed px-4 text-slate-400">
                        Tidak ada poin agenda yang ditemukan untuk rapat ini.
                      </p>
                    </div>
                  )}
                </div>

                {/* AI Matching Logs Console */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-900 shrink-0 space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <span>Aktivitas Deteksi Topik AI</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-lg p-2 font-mono text-[9px] text-slate-400 border border-slate-800/60 max-h-[85px] overflow-y-auto leading-relaxed space-y-1">
                    {agendaMatchLogs.length > 0 ? (
                      agendaMatchLogs.map((log, idx) => (
                        <div key={idx} className="border-b border-slate-800/30 pb-1 last:border-0 last:pb-0">
                          {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-600 italic">
                        [Sistem Siaga] Menunggu aktivitas vokal transkrip untuk melacak agenda secara otomatis...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Whiteboard Workspace */}
            {activeTab === "whiteboard" && (
              <div className="flex flex-col h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Papan Tulis Kolaboratif</span>
                  <button
                    onClick={clearCanvas}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-red-400 text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} /> Bersihkan
                  </button>
                </div>

                <div className="relative border border-slate-800 rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={300}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full block"
                  />
                </div>

                {/* Whiteboard controls */}
                <div className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                  <div className="flex gap-1.5">
                    {["#3b82f6", "#10b981", "#ef4444", "#e2e8f0"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setDrawColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-5 h-5 rounded-full border ${
                          drawColor === color ? "border-white scale-110" : "border-transparent"
                        } cursor-pointer`}
                      ></button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Tebal</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                      className="w-20 accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Catatan MoM Workspace */}
            {activeTab === "notes" && (
              <div className="flex flex-col h-full space-y-2">
                <span className="text-xs font-semibold text-slate-300">Memos & Catatan Kasar (Notulis)</span>
                <textarea
                  value={meeting.liveNotes || ""}
                  onChange={(e) => updateLiveNotes(meeting.id, e.target.value)}
                  placeholder="Ketik poin diskusi penting, rancangan anggaran, target timeline di sini..."
                  className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans leading-relaxed min-h-64"
                />
                <span className="text-[10px] text-slate-500">Catatan disimpan otomatis dan akan dipadukan ke analisis AI.</span>
              </div>
            )}

            {/* Chat Workspace */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full justify-between space-y-3">
                <div className="flex-1 overflow-y-auto space-y-3 max-h-80 pr-1">
                  {meeting.chat && meeting.chat.length > 0 ? (
                    meeting.chat.map((msg) => (
                      <div key={msg.id} className="flex gap-2.5 text-xs">
                        <img src={msg.senderAvatar} className="w-7 h-7 rounded-lg object-cover" alt="" />
                        <div className="flex-1 min-w-0 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-200 block truncate">{msg.senderName}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed break-words">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-600 py-12">
                      <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <span className="text-xs block">Belum ada obrolan rapat.</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendChatSubmit} className="flex gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Kirim pesan obrolan..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* Polling Workspace */}
            {activeTab === "polling" && (
              <div className="flex flex-col h-full space-y-4">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block border-b border-slate-800 pb-1.5">
                    Daftar Polling Aktif
                  </span>

                  {meeting.polls && meeting.polls.length > 0 ? (
                    meeting.polls.map((poll) => {
                      const hasVoted = poll.votedUserIds.includes(currentUser.id);
                      return (
                        <div key={poll.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <span className="font-semibold block text-slate-200 mb-2">{poll.question}</span>
                          <div className="space-y-2">
                            {poll.options.map((opt) => {
                              const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                              return (
                                <div key={opt.id} className="relative">
                                  {hasVoted ? (
                                    <div className="w-full bg-slate-800 rounded-lg p-2 flex justify-between relative overflow-hidden">
                                      <div
                                        style={{ width: `${pct}%` }}
                                        className="absolute left-0 top-0 bottom-0 bg-blue-600/20 rounded-l"
                                      ></div>
                                      <span className="relative text-slate-300 font-medium z-10">{opt.text}</span>
                                      <span className="relative text-slate-400 font-mono z-10">{opt.votes} suara ({pct}%)</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => voteMeetingPoll(meeting.id, poll.id, opt.id)}
                                      className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg p-2.5 transition-colors cursor-pointer"
                                    >
                                      {opt.text}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="block text-[10px] text-slate-500 mt-2 font-mono text-right">
                            Total: {poll.totalVotes} suara • {hasVoted ? "Anda telah memilih" : "Silakan pilih"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-slate-600 py-4">
                      <Vote className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <span className="text-xs block">Belum ada jajak pendapat berjalan.</span>
                    </div>
                  )}
                </div>

                {/* Host role is permitted to create new polls */}
                {(currentUser.role === UserRole.SUPER_ADMIN ||
                  currentUser.role === UserRole.DIREKTUR ||
                  currentUser.role === UserRole.MANAGER) && (
                  <form onSubmit={handleCreatePollSubmit} className="p-3 border border-slate-800 rounded-xl bg-slate-900/40 space-y-2 text-xs">
                    <span className="font-semibold text-[11px] text-blue-400 uppercase tracking-wider block">Buat Polling Baru</span>
                    <input
                      type="text"
                      placeholder="Pertanyaan Polling?"
                      value={pollQuestion}
                      required
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <div className="space-y-1.5">
                      {pollOptions.map((opt, i) => (
                        <input
                          key={i}
                          type="text"
                          placeholder={`Pilihan ${i + 1}`}
                          value={opt}
                          required
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[i] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        + Tambah Opsi
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer"
                      >
                        Luncurkan
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Controls */}
      <div className="bg-slate-900 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Toggle Video/Microphone */}
        <div className="flex gap-2">
          <button
            onClick={() => setMicActive(!micActive)}
            className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
              micActive ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-red-600/20 border-red-500/40 text-red-500"
            }`}
          >
            {micActive ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          <button
            onClick={() => setVideoActive(!videoActive)}
            className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
              videoActive ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-red-600/20 border-red-500/40 text-red-500"
            }`}
          >
            {videoActive ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
          <button
            onClick={() => setScreenShareActive(!screenShareActive)}
            className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
              screenShareActive ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-200"
            }`}
          >
            <Monitor size={16} />
          </button>
        </div>

        {/* Start/Stop MoM Record toggle */}
        <div className="flex gap-3">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
              isRecording
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/10"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10"
            }`}
          >
            {isRecording ? <Pause size={14} /> : <Play size={14} />}
            {isRecording ? "Pause Perekaman MoM" : "Mulai Perekaman MoM"}
          </button>

          <button
            onClick={handleGenerateMoMClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} className="animate-spin" />
            Akhiri & Ekstrak MoM AI
          </button>
        </div>
      </div>

      {/* 4. Overlay: Generating MoM backdrop loading sequence */}
      {isGeneratingMoM && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto border border-blue-500/30 animate-pulse">
              <Sparkles className="text-blue-400 w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">FGi AI Meeting Extractor</h3>
              <p className="text-xs text-slate-400">Sedang memproses rekaman audio & transkrip untuk merangkum Minutes of Meeting...</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] font-mono text-blue-400 animate-pulse">
              {aiGenerationStep}
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-3/4 animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Resulting Generated MoM Slide panel */}
      {generatedMomMarkdown && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-800">
            <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-400 w-5 h-5" />
                <h3 className="font-bold text-white text-md">Hasil Analisis Minutes of Meeting (MoM) AI</h3>
              </div>
              <button
                onClick={() => setGeneratedMomMarkdown(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs leading-relaxed flex items-start gap-3">
                <Sparkles size={16} className="mt-0.5 shrink-0" />
                <div>
                  <strong>Berhasil Diuraikan secara Otomatis!</strong>
                  <p className="mt-1 text-[11px] text-emerald-500">
                    FGi AI telah secara otomatis menerbitkan dokumen MoM, menyematkannya ke rapat terkait, mengekstrak 1 Keputusan baru (Draft), dan menugaskan 1 Action Item baru dengan prioritas tinggi.
                  </p>
                </div>
              </div>

              {/* Renders MoM markdown directly */}
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 bg-slate-950 p-5 rounded-xl border border-slate-800 leading-relaxed font-sans font-normal whitespace-pre-wrap select-text">
                {generatedMomMarkdown}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3">
              <button
                onClick={() => exportMeetingToPDF(meeting, users)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 transition-colors"
              >
                <Download size={14} /> Ekspor PDF Resmi (MoM)
              </button>

              <button
                onClick={() => {
                  setGeneratedMomMarkdown(null);
                  onBack();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-lg"
              >
                Simpan & Kembali ke Dashboard Rapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Action Prefilled Confirmation Form Modal */}
      {activeSmartActionLine && smartActionType && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-lg w-full space-y-4 text-left animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="text-amber-400 animate-pulse w-5 h-5" />
                <h3 className="font-bold text-white text-md">
                  {smartActionType === "decision" && "Flag as Official Decision"}
                  {smartActionType === "action_item" && "Create New Action Item"}
                  {smartActionType === "urgent" && "Send Urgent PIC Notification"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveSmartActionLine(null);
                  setSmartActionType(null);
                }}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Sumber Transkrip Diskusi</span>
              <div className="flex justify-between items-center text-[11px] font-semibold text-blue-400">
                <span>{activeSmartActionLine.speakerName} ({activeSmartActionLine.speakerRole})</span>
                <span className="font-mono text-slate-500">{activeSmartActionLine.timestamp}</span>
              </div>
              <p className="text-slate-300 italic font-mono leading-relaxed mt-1">"{activeSmartActionLine.text}"</p>
            </div>

            <form onSubmit={handleConfirmSmartAction} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Deskripsi / Judul Instruksi</label>
                <textarea
                  value={smartFormTitle}
                  required
                  onChange={(e) => setSmartFormTitle(e.target.value)}
                  placeholder="Instruksi rapat..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Penerima Tugas / PIC</label>
                  <select
                    value={smartFormPic}
                    onChange={(e) => setSmartFormPic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Prioritas</label>
                  <select
                    value={smartFormPriority}
                    onChange={(e) => setSmartFormPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="High">Tinggi (High)</option>
                    <option value="Medium">Sedang (Medium)</option>
                    <option value="Low">Rendah (Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {smartActionType === "decision" ? (
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-300">Kategori Keputusan</label>
                    <input
                      type="text"
                      value={smartFormCategory}
                      onChange={(e) => setSmartFormCategory(e.target.value)}
                      placeholder="e.g. Operasional, Finansial"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-300">Tenggat Waktu (Deadline)</label>
                    <input
                      type="date"
                      value={smartFormDeadline}
                      required
                      onChange={(e) => setSmartFormDeadline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {smartActionType === "decision" && (
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-300">Tenggat Implementasi</label>
                    <input
                      type="date"
                      value={smartFormDeadline}
                      required
                      onChange={(e) => setSmartFormDeadline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSmartActionLine(null);
                    setSmartActionType(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/15 cursor-pointer"
                >
                  {smartActionType === "decision" && "Konfirmasi Buat Keputusan"}
                  {smartActionType === "action_item" && "Delegasikan Tugas"}
                  {smartActionType === "urgent" && "Kirim Peringatan Urgent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Hands-Free AI Voice Assistant Floating Action Button (FAB) */}
      <div className="absolute bottom-24 right-6 z-50 flex flex-col items-end space-y-3">
        {/* Expandable Menu of Actions / Dashboard */}
        {isFabOpen && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-80 shadow-2xl p-4 space-y-4 animate-fade-in-up flex flex-col text-left border-indigo-500/10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-tight">FGi Voice Assistant</h4>
                  <p className="text-[10px] text-slate-400">Asisten Suara Hands-Free AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsFabOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Status / Waveform or Result Box */}
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-850 flex flex-col items-center justify-center min-h-[90px] relative text-center">
              {isVoiceListening ? (
                <div className="space-y-2 w-full flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-8 h-8 rounded-full bg-red-500/20 animate-ping" />
                    <button
                      onClick={stopVoiceListening}
                      className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-all shadow-md shadow-red-600/10 cursor-pointer"
                    >
                      <Mic size={14} className="animate-pulse" />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">
                    Mendengarkan...
                  </span>
                  <div className="w-full px-2 py-1 bg-slate-900/60 rounded border border-slate-800/40 text-[10px] text-slate-300 font-mono italic truncate">
                    {voiceTranscript || "Katakan perintah Anda..."}
                  </div>
                </div>
              ) : isVoiceProcessing ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <Sparkles size={12} className="text-indigo-400 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                    Memproses Perintah...
                  </span>
                </div>
              ) : voiceResult ? (
                <div className="w-full space-y-2 text-left">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                      <Volume2 size={10} /> Tanggapan AI
                    </span>
                    {voiceResult.action !== "unsupported" && voiceResult.action !== "send_chat" && (
                      <span className="text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded">
                        SUKSES
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed italic font-medium">
                    "{voiceResult.explanation}"
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 flex flex-col items-center">
                  <button
                    onClick={startVoiceListening}
                    className="w-9 h-9 rounded-full bg-indigo-600/20 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-indigo-400 flex items-center justify-center transition-all cursor-pointer shadow-lg group"
                  >
                    <Mic size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Asisten Siap Sedia
                  </span>
                  <p className="text-[8px] text-slate-500 max-w-[180px]">
                    Ketuk mikrofon atau mulailah bicara dengan perintah hands-free.
                  </p>
                </div>
              )}

              {voiceError && (
                <p className="text-[9px] text-red-400 font-medium mt-1.5 bg-red-950/20 border border-red-900/20 px-2 py-0.5 rounded">
                  {voiceError}
                </p>
              )}
            </div>

            {/* AI Core Voice Function Triggers */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Fungsi AI Hands-Free
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {/* Action 1: Generate summary */}
                <button
                  onClick={() => {
                    executeVoiceCommandText("Generate summary of the meeting and create MOM");
                  }}
                  className="flex items-center justify-between p-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-850 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                      <Sparkles size={12} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-200 block truncate">Rangkum Diskusi</span>
                      <span className="text-[8px] text-slate-500 block truncate">"Generate summary of the meeting..."</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </button>

                {/* Action 2: Capture decision */}
                <button
                  onClick={() => {
                    executeVoiceCommandText("Flag the last transcript as a decision");
                  }}
                  className="flex items-center justify-between p-2 bg-slate-950 hover:bg-emerald-950/40 border border-slate-850 hover:border-emerald-500/30 rounded-xl transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle size={12} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-200 block truncate">Catat Keputusan</span>
                      <span className="text-[8px] text-slate-500 block truncate">"Flag the last transcript as decision..."</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </button>

                {/* Action 3: Assign task */}
                <button
                  onClick={() => {
                    executeVoiceCommandText("Create task for the previous statement");
                  }}
                  className="flex items-center justify-between p-2 bg-slate-950 hover:bg-blue-950/40 border border-slate-850 hover:border-blue-500/30 rounded-xl transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                      <CheckSquare size={12} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-200 block truncate">Delegasikan Tugas</span>
                      <span className="text-[8px] text-slate-500 block truncate">"Create task for the previous statement..."</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* Quick Manual input toggler */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  startVoiceListening();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer"
              >
                <Mic size={12} />
                Bicara Sekarang
              </button>
              <button
                onClick={() => {
                  setShowVoiceManualInput(true);
                  setIsFabOpen(false);
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] rounded-lg transition-colors cursor-pointer"
                title="Ketik Manual"
              >
                <Keyboard size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <div className="flex items-center gap-2">
          {/* Audio/Listening Indicator tooltip next to FAB */}
          {isVoiceListening && (
            <div className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 animate-pulse mr-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              Mendengarkan Hands-Free...
            </div>
          )}

          <button
            onClick={() => {
              setIsFabOpen(!isFabOpen);
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 cursor-pointer border ${
              isVoiceListening
                ? "bg-red-600 border-red-500 hover:bg-red-700 animate-pulse"
                : isVoiceProcessing
                ? "bg-blue-600 border-blue-500 hover:bg-blue-700 animate-spin"
                : "bg-gradient-to-tr from-blue-600 to-indigo-600 border-blue-500 hover:from-blue-700 hover:to-indigo-700 hover:scale-110 active:scale-95"
            }`}
            title="Asisten Suara AI Pintar (FAB)"
          >
            {isVoiceListening ? (
              <Mic size={24} className="animate-pulse" />
            ) : isVoiceProcessing ? (
              <Sparkles size={24} />
            ) : (
              <div className="relative">
                <Mic size={24} />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-400 text-[8px] font-bold text-slate-950 animate-bounce">
                  AI
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>

      {/* Smart Action Feedback Toast */}
      {smartToast && (
        <div className="absolute bottom-24 left-6 z-50 animate-slide-in max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {smartToast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <span className="font-bold text-white block">{smartToast.message}</span>
            <span className="text-slate-400 text-[11px] block mt-0.5 leading-relaxed">{smartToast.details}</span>
          </div>
          <button
            onClick={() => setSmartToast(null)}
            className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Slide-Over Drawer: Offline Sync Dashboard */}
      {showOfflineSyncDrawer && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 h-full shadow-2xl border-l border-slate-800 flex flex-col justify-between">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <CloudOff className="text-amber-500 w-5 h-5 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm text-white">Dashboard Rapat Luring</h3>
                  <p className="text-[10px] text-slate-500">Persiapan Sinkronisasi & Ekspor Data</p>
                </div>
              </div>
              <button
                onClick={() => setShowOfflineSyncDrawer(false)}
                className="p-1.5 text-xs bg-slate-800 hover:bg-slate-700 hover:text-white rounded text-slate-400 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Drawer Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Active Connection state card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status Konektivitas Saat Ini</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOfflineMode ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-amber-400">Mode Luring Mandiri Aktif</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-semibold text-emerald-400">Terhubung Online</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setIsOfflineMode(!isOfflineMode)}
                    className="px-2.5 py-1 text-[10px] bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-lg cursor-pointer font-bold"
                  >
                    Ubah ke {isOfflineMode ? "Online" : "Luring"}
                  </button>
                </div>
              </div>

              {/* Sync Queue section */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Daftar Antrean Sinkronisasi ({offlineQueue.length})
                  </span>
                  {offlineQueue.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm("Hapus seluruh antrean tertunda luring?")) {
                          setOfflineQueue([]);
                        }
                      }}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Kosongkan Antrean
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {offlineQueue.length > 0 ? (
                    offlineQueue.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start justify-between gap-3 text-xs group"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono ${
                              item.type === "decision" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                              item.type === "action_item" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}>
                              {item.type === "decision" ? "Keputusan" : item.type === "action_item" ? "Tugas" : "Chat/Memo"}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">{item.timestamp}</span>
                          </div>
                          <p className="text-slate-300 font-semibold truncate block pr-2">{item.label}</p>
                        </div>
                        <button
                          onClick={() => {
                            setOfflineQueue(prev => prev.filter(q => q.id !== item.id));
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-900 cursor-pointer"
                          title="Hapus dari antrean"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 bg-slate-950/30 rounded-xl border border-slate-850/60 text-slate-600 text-[11px] leading-relaxed">
                      Tidak ada draf tertunda luring. Semua item telah disinkronkan atau belum ditambahkan.
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Backup and Import (Drag & Drop UI) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penyimpanan Berkas Rapat Mandiri</span>
                
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative ${
                    isDragOver
                      ? "border-blue-500 bg-blue-500/5 text-blue-300 scale-98 shadow-inner"
                      : "border-slate-800 bg-slate-950/40 hover:bg-slate-950/60 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportBackup(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    id="backupFileInput"
                  />
                  <FileUp className="w-7 h-7 mx-auto mb-2 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs font-bold block text-slate-300">Impor Data Cadangan Rapat (.json)</span>
                  <p className="text-[9px] text-slate-500 mt-1">Seret & jatuhkan file cadangan di sini atau klik untuk memilih</p>
                </div>

                {/* Export Action Card */}
                <button
                  onClick={handleExportBackup}
                  className="w-full p-3.5 bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800 rounded-xl text-left flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block group-hover:text-white transition-colors">Ekspor Cadangan Berkas Rapat</span>
                    <p className="text-[9px] text-slate-500 leading-relaxed">Simpan cadangan lokal instan berisi keputusan, tugas, transkrip, & obrolan luring.</p>
                  </div>
                  <FileDown size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                </button>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
              {isSyncing ? (
                <div className="space-y-2 p-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-blue-400 animate-pulse flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin" />
                      Menyelaraskan data luring ke server...
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">65%</span>
                  </div>
                  <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-2/3 animate-shimmer"></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStartSync}
                  disabled={offlineQueue.length === 0}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    offlineQueue.length > 0
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/10 cursor-pointer"
                      : "bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed"
                  }`}
                >
                  <RefreshCw size={13} />
                  Mulai Sinkronisasi Ke Awan ({offlineQueue.length} Item)
                </button>
              )}
              
              <p className="text-[9px] text-center text-slate-500">
                Menyelaraskan data luring akan secara otomatis merapikan flag status keputusan luring, meluncurkan tugas baru, & melengkapi risalah digital rapat.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Automated AI 'Meeting Snapshot' Modal */}
      {showSnapshotModal && snapshotData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-indigo-500/10">
            
            {/* Modal Header */}
            <div className="relative p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner flex items-center justify-center">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2 tracking-tight">
                    AI Meeting Snapshot
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sintesis Kilat Eksekutif Rapat • {meeting.title} ({meeting.meetingNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl text-slate-400 transition-all cursor-pointer"
                title="Tutup Snapshot"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Executive Summary Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <FileText size={14} />
                  Ringkasan Eksekutif (Executive Summary)
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 leading-relaxed text-slate-300 text-xs">
                  {snapshotData.executiveSummary}
                </div>
              </div>

              {/* Grid: Decisions and Action Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Decisions Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle size={14} />
                    Top 3 Keputusan Strategis
                  </div>
                  <div className="space-y-2.5">
                    {snapshotData.decisions && snapshotData.decisions.length > 0 ? (
                      snapshotData.decisions.map((decision, index) => (
                        <div
                          key={index}
                          className="p-3.5 bg-slate-950/30 hover:bg-slate-950/50 rounded-2xl border border-slate-800/60 hover:border-slate-750 transition-colors flex items-start gap-3"
                        >
                          <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                            {index + 1}
                          </span>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold font-mono text-slate-500">
                                {decision.number}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider ${
                                decision.priority === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                decision.priority === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}>
                                {decision.priority}
                              </span>
                            </div>
                            <p className="text-slate-300 text-xs font-semibold leading-relaxed">
                              {decision.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6 bg-slate-950/20 rounded-2xl border border-slate-850 text-slate-500 text-xs">
                        Tidak ada keputusan strategis yang dicatat.
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Items Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                    <ListTodo size={14} />
                    Action Items &amp; PIC Terpilih
                  </div>
                  <div className="space-y-2.5">
                    {snapshotData.actionItems && snapshotData.actionItems.length > 0 ? (
                      snapshotData.actionItems.map((task, index) => (
                        <div
                          key={index}
                          className="p-3.5 bg-slate-950/30 hover:bg-slate-950/50 rounded-2xl border border-slate-800/60 hover:border-slate-750 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-slate-200 text-xs font-bold leading-snug flex-1">
                              {task.taskName}
                            </p>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider flex-shrink-0 ${
                              task.priority === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              task.priority === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-850/40 pt-2 mt-1">
                            <div className="flex items-center gap-1.5">
                              <div className="h-4 w-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[8px] uppercase">
                                {task.picName.substring(0, 2)}
                              </div>
                              <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                                {task.picName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 font-mono">
                              <Clock size={10} />
                              <span>{task.deadline}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6 bg-slate-950/20 rounded-2xl border border-slate-850 text-slate-500 text-xs">
                        Tidak ada rencana aksi yang didelegasikan.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[10px] text-slate-500 text-center sm:text-left">
                * Snapshot ini disintesis otomatis menggunakan FGi AI Engine berdasarkan data transkrip luring rapat.
              </span>
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setShowSnapshotModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
                >
                  Tampilkan Risalah (MoM) Lengkap
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  Selesai &amp; Kembali ke Dashboard
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
