/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, Meeting, Decision, ActionItem, MasterData, ChatMessage, Poll, MeetingTranscriptLine } from "../types";
import { DEFAULT_USERS, DEFAULT_MASTER_DATA, DEFAULT_MEETINGS, DEFAULT_DECISIONS, DEFAULT_ACTION_ITEMS } from "../data";

interface AppContextProps {
  currentUser: User;
  users: User[];
  meetings: Meeting[];
  decisions: Decision[];
  actionItems: ActionItem[];
  masterData: MasterData;
  setCurrentUser: (user: User) => void;
  // Master data management
  addMasterItem: (category: keyof MasterData, item: string) => void;
  // Meeting management
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (meeting: Meeting) => void;
  deleteMeeting: (id: string) => void;
  // Active ongoing meeting states
  activeMeetingId: string | null;
  setActiveMeetingId: (id: string | null) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  recordingDuration: number; // in seconds
  setRecordingDuration: React.Dispatch<React.SetStateAction<number>>;
  sendMeetingChat: (meetingId: string, text: string) => void;
  createMeetingPoll: (meetingId: string, question: string, options: string[]) => void;
  voteMeetingPoll: (meetingId: string, pollId: string, optionId: string) => void;
  appendTranscriptLine: (meetingId: string, line: MeetingTranscriptLine) => void;
  updateLiveNotes: (meetingId: string, notes: string) => void;
  saveMoM: (meetingId: string, momMarkdown: string) => void;
  // Decision management
  addDecision: (decision: Decision) => void;
  updateDecisionStatus: (id: string, status: Decision["status"]) => void;
  signDecision: (id: string, signatureData: string) => void;
  // Action Item (Tasks) management
  addActionItem: (item: ActionItem) => void;
  updateActionItem: (item: ActionItem) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  submitEvidence: (taskId: string, evidenceNote: string, fileBase64?: string) => void;
  approveActionItem: (taskId: string) => void;
  // Gemini Assistant triggers
  askAIChat: (message: string) => Promise<string>;
  generateMoMWithAI: (meetingId: string) => Promise<string>;
  // Global theme
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Database states
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("fgi_users");
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUserInternal] = useState<User>(() => {
    const saved = localStorage.getItem("fgi_current_user");
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0];
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem("fgi_meetings");
    return saved ? JSON.parse(saved) : DEFAULT_MEETINGS;
  });

  const [decisions, setDecisions] = useState<Decision[]>(() => {
    const saved = localStorage.getItem("fgi_decisions");
    return saved ? JSON.parse(saved) : DEFAULT_DECISIONS;
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const saved = localStorage.getItem("fgi_action_items");
    return saved ? JSON.parse(saved) : DEFAULT_ACTION_ITEMS;
  });

  const [masterData, setMasterData] = useState<MasterData>(() => {
    const saved = localStorage.getItem("fgi_master_data");
    return saved ? JSON.parse(saved) : DEFAULT_MASTER_DATA;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("fgi_dark_mode");
    return saved === "true";
  });

  // Active meeting states
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("fgi_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("fgi_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("fgi_meetings", JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem("fgi_decisions", JSON.stringify(decisions));
  }, [decisions]);

  useEffect(() => {
    localStorage.setItem("fgi_action_items", JSON.stringify(actionItems));
  }, [actionItems]);

  useEffect(() => {
    localStorage.setItem("fgi_master_data", JSON.stringify(masterData));
  }, [masterData]);

  useEffect(() => {
    localStorage.setItem("fgi_dark_mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Active meeting timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const setCurrentUser = (user: User) => {
    setCurrentUserInternal(user);
  };

  const addMasterItem = (category: keyof MasterData, item: string) => {
    setMasterData((prev) => {
      const list = prev[category] as any[];
      if (list.includes(item)) return prev;
      return {
        ...prev,
        [category]: [...list, item]
      };
    });
  };

  const addMeeting = (meeting: Meeting) => {
    setMeetings((prev) => [meeting, ...prev]);
  };

  const updateMeeting = (updatedMtg: Meeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === updatedMtg.id ? updatedMtg : m)));
  };

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  const sendMeetingChat = (meetingId: string, text: string) => {
    const newMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetingId) {
          return {
            ...m,
            chat: [...(m.chat || []), newMessage]
          };
        }
        return m;
      })
    );
  };

  const createMeetingPoll = (meetingId: string, question: string, options: string[]) => {
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      question,
      options: options.map((opt, i) => ({ id: `opt-${i}`, text: opt, votes: 0 })),
      totalVotes: 0,
      active: true,
      votedUserIds: []
    };

    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetingId) {
          return {
            ...m,
            polls: [...(m.polls || []), newPoll]
          };
        }
        return m;
      })
    );
  };

  const voteMeetingPoll = (meetingId: string, pollId: string, optionId: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetingId) {
          const updatedPolls = (m.polls || []).map((p) => {
            if (p.id === pollId) {
              if (p.votedUserIds.includes(currentUser.id)) return p; // Cannot vote twice
              const updatedOptions = p.options.map((opt) => {
                if (opt.id === optionId) {
                  return { ...opt, votes: opt.votes + 1 };
                }
                return opt;
              });
              return {
                ...p,
                options: updatedOptions,
                totalVotes: p.totalVotes + 1,
                votedUserIds: [...p.votedUserIds, currentUser.id]
              };
            }
            return p;
          });
          return { ...m, polls: updatedPolls };
        }
        return m;
      })
    );
  };

  const appendTranscriptLine = (meetingId: string, line: MeetingTranscriptLine) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetingId) {
          return {
            ...m,
            transcript: [...(m.transcript || []), line]
          };
        }
        return m;
      })
    );
  };

  const updateLiveNotes = (meetingId: string, notes: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, liveNotes: notes } : m))
    );
  };

  const saveMoM = (meetingId: string, momMarkdown: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, momMarkdown, status: "Completed" } : m))
    );
  };

  const addDecision = (decision: Decision) => {
    setDecisions((prev) => [decision, ...prev]);
  };

  const updateDecisionStatus = (id: string, status: Decision["status"]) => {
    setDecisions((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const change = {
            date: new Date().toISOString().replace("T", " ").substring(0, 16),
            userId: currentUser.id,
            userName: currentUser.name,
            action: `Mengubah status keputusan menjadi: ${status}`
          };
          return {
            ...d,
            status,
            history: [...d.history, change]
          };
        }
        return d;
      })
    );
  };

  const signDecision = (id: string, signatureData: string) => {
    setDecisions((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const alreadySigned = d.signatures.some((s) => s.userId === currentUser.id);
          if (alreadySigned) return d;

          const newSignature = {
            userId: currentUser.id,
            userName: currentUser.name,
            timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
            signatureData
          };

          const change = {
            date: new Date().toISOString().replace("T", " ").substring(0, 16),
            userId: currentUser.id,
            userName: currentUser.name,
            action: "Menandatangani keputusan secara digital"
          };

          const newSignatures = [...d.signatures, newSignature];
          // Auto approve if board of directors signs
          const isDirector = currentUser.role === UserRole.DIREKTUR || currentUser.role === UserRole.SUPER_ADMIN;
          const status: Decision["status"] = isDirector && newSignatures.length >= 2 ? "Approved" : d.status;

          return {
            ...d,
            signatures: newSignatures,
            status,
            history: [...d.history, change]
          };
        }
        return d;
      })
    );
  };

  const addActionItem = (item: ActionItem) => {
    setActionItems((prev) => [item, ...prev]);
  };

  const updateActionItem = (updatedItem: ActionItem) => {
    setActionItems((prev) => prev.map((t) => (t.id === updatedItem.id ? updatedItem : t)));
  };

  const toggleChecklistItem = (taskId: string, itemId: string) => {
    setActionItems((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedChecklist = task.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
          const completedCount = updatedChecklist.filter((c) => c.done).length;
          const progress = Math.round((completedCount / updatedChecklist.length) * 100) || 0;
          const status = progress === 100 ? "In Review" : "In Progress";

          return {
            ...task,
            checklist: updatedChecklist,
            progress,
            status: task.status === "Completed" ? "Completed" : status
          };
        }
        return task;
      })
    );
  };

  const submitEvidence = (taskId: string, evidenceNote: string, fileBase64?: string) => {
    setActionItems((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            evidenceNote,
            evidenceUrl: fileBase64 || "uploaded_evidence_document.pdf",
            status: "In Review"
          };
        }
        return task;
      })
    );
  };

  const approveActionItem = (taskId: string) => {
    setActionItems((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            status: "Completed",
            progress: 100,
            approvedBy: currentUser.name
          };
        }
        return task;
      })
    );
  };

  // API Call: Intelligent Semantic AI Assistant
  const askAIChat = async (message: string): Promise<string> => {
    try {
      // Package active local context to feed the AI
      const contextData = {
        meetings: meetings.map((m) => ({
          title: m.title,
          meetingNumber: m.meetingNumber,
          date: m.date,
          type: m.type,
          agenda: m.agenda,
          goal: m.goal,
          status: m.status,
          liveNotes: m.liveNotes
        })),
        decisions: decisions.map((d) => ({
          decisionNumber: d.decisionNumber,
          description: d.description,
          category: d.category,
          priority: d.priority,
          status: d.status,
          pic: users.find((u) => u.id === d.picId)?.name || "Unknown",
          date: d.date,
          originMeeting: d.meetingTitle
        })),
        actionItems: actionItems.map((a) => ({
          taskNumber: a.taskNumber,
          name: a.name,
          pic: users.find((u) => u.id === a.picId)?.name || "Unknown",
          deadline: a.deadline,
          status: a.status,
          progress: a.progress,
          originMeeting: a.meetingTitle
        }))
      };

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, contextData })
      });

      if (!response.ok) {
        throw new Error("Gagal menghubungi server asisten AI.");
      }

      const data = await response.json();
      return data.text || "Gagal mendapatkan respon asisten.";
    } catch (err: any) {
      console.error("AI Chat Assistant call failed:", err);
      return `Koneksi gagal. Layanan AI tidak terhubung: ${err.message}. Menggunakan sintesis pencarian lokal:
Ditemukan ${meetings.length} Rapat, ${decisions.length} Keputusan, ${actionItems.length} Tugas Action Item.`;
    }
  };

  // API Call: AI Summarizer and MoM Analyzer
  const generateMoMWithAI = async (meetingId: string): Promise<string> => {
    try {
      const mtg = meetings.find((m) => m.id === meetingId);
      if (!mtg) throw new Error("Meeting not found");

      // Compile raw text to synthesize MoM from
      const transcriptText = mtg.transcript?.length > 0 
        ? mtg.transcript.map((t) => `[${t.timestamp}] ${t.speakerName} (${t.speakerRole}): ${t.text}`).join("\n")
        : "";

      const payload = {
        meetingTitle: mtg.title,
        meetingNumber: mtg.meetingNumber,
        agenda: mtg.agenda,
        transcript: `${transcriptText}\n\nCatatan Tambahan:\n${mtg.liveNotes || ""}`,
        participantCount: mtg.participantIds.length,
        date: mtg.date
      };

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Gagal menghasilkan MoM menggunakan Gemini.");
      }

      const data = await response.json();
      return data.text || "Sintesis MoM kosong.";
    } catch (err: any) {
      console.error("Gemini MoM request failed:", err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        meetings,
        decisions,
        actionItems,
        masterData,
        setCurrentUser,
        addMasterItem,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        activeMeetingId,
        setActiveMeetingId,
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
        updateDecisionStatus,
        signDecision,
        addActionItem,
        updateActionItem,
        toggleChecklistItem,
        submitEvidence,
        approveActionItem,
        askAIChat,
        generateMoMWithAI,
        darkMode,
        setDarkMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
