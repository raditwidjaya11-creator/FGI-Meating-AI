/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Meeting, MeetingType, LocationType, UserRole } from "../types";
import {
  CalendarDays,
  List,
  Plus,
  Video,
  MapPin,
  Clock,
  Briefcase,
  ChevronRight,
  User,
  Search,
  Filter,
  Check,
  AlertCircle,
  Link,
  UploadCloud,
  X,
  Sparkles,
  FileText,
  Download,
  Trash2,
  Bell,
  Volume2
} from "lucide-react";
import { exportMeetingToPDF } from "../utils/pdfExport";

export interface CustomMeetingTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  type: MeetingType;
  startTime: string;
  endTime: string;
  locationType: LocationType;
  locationDetail: string;
  project: string;
  goal: string;
  agenda: string;
  selectedParticipants: string[];
}

const MEETING_TEMPLATES = [
  {
    id: "weekly_standup",
    name: "Weekly Standup Sync",
    description: "Penyelarasan tim operasional mingguan secara kilat.",
    title: "Weekly Standup - [Nama Proyek]",
    type: "Operational" as MeetingType,
    startTime: "09:00",
    endTime: "09:30",
    locationType: "Online" as LocationType,
    locationDetail: "Google Meet Link (Otomatis)",
    agenda: "1. Update kemajuan pekerjaan & progres 7 hari terakhir.\n2. Hambatan/kendala utama yang memerlukan bantuan tim.\n3. Rencana prioritas aksi untuk 7 hari ke depan."
  },
  {
    id: "project_review",
    name: "Project Review & Kurva S",
    description: "Review berkala deviasi kurva S fisik dan anggaran.",
    title: "Tinjauan Proyek & Grafik Kurva S - [Nama Proyek]",
    type: "Project Review" as MeetingType,
    startTime: "10:00",
    endTime: "11:30",
    locationType: "Hybrid" as LocationType,
    locationDetail: "Ruang VIP Merbabu / Hybrid Link",
    agenda: "1. Pemaparan deviasi progres fisik aktual terhadap rencana kurva S.\n2. Hambatan logistik, pengadaan material, & subkontraktor.\n3. Evaluasi sisa anggaran taktis & persetujuan invoice termin."
  },
  {
    id: "board_meeting",
    name: "Board Strategic Meeting",
    description: "Rapat direksi strategis pengambilan keputusan krusial.",
    title: "Rapat Direksi Triwulan & Pengambilan Keputusan",
    type: "Strategic" as MeetingType,
    startTime: "13:30",
    endTime: "15:30",
    locationType: "Offline" as LocationType,
    locationDetail: "Ruang Rapat Direksi Utama",
    agenda: "1. Laporan kinerja keuangan konsolidasi dan arus kas perusahaan.\n2. Pengambilan keputusan investasi pembelian alat berat baru.\n3. Evaluasi manajemen risiko & pengesahan Minutes of Meeting (MoM)."
  },
  {
    id: "client_briefing",
    name: "Client Presentation",
    description: "Presentasi draf desain final & persetujuan owner.",
    title: "Client Pitch & Design Sign-off Meeting",
    type: "Client Board" as MeetingType,
    startTime: "11:00",
    endTime: "12:00",
    locationType: "Hybrid" as LocationType,
    locationDetail: "Ruang Pertemuan Eksekutif / Zoom",
    agenda: "1. Pemaparan hasil revisi desain 3D & spesifikasi teknis.\n2. Diskusi masukan dari owner & negosiasi nilai kontrak tambalan.\n3. Penandatanganan berita acara persetujuan draf (MoM)."
  }
];

interface MeetingsViewProps {
  onLaunchMeeting: (meeting: Meeting) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({ onLaunchMeeting }) => {
  const { meetings, addMeeting, users, masterData, currentUser, addMasterItem, addToast, playChime } = useApp();
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "timeline">("list");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [selectedCompletedMeeting, setSelectedCompletedMeeting] = useState<Meeting | null>(null);

  // Push notifications configuration state
  const [pushEnabled, setPushEnabled] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission === "granted";
    }
    return false;
  });

  const handleTogglePushNotifications = async () => {
    if (!("Notification" in window)) {
      addToast({
        title: "Push Notifikasi Tidak Didukung",
        message: "Browser Anda tidak mendukung push notifikasi HTML5.",
        type: "warning"
      });
      return;
    }

    if (Notification.permission === "granted") {
      addToast({
        title: "Push Notifikasi Aktif",
        message: "Notifikasi browser sudah aktif untuk komputer ini.",
        type: "success"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        addToast({
          title: "Izin Diberikan! 🔔",
          message: "Anda akan menerima notifikasi desktop untuk rapat terjadwal.",
          type: "success"
        });
      } else {
        addToast({
          title: "Izin Ditolak / Dibatasi",
          message: "Izin notifikasi ditolak. Kami akan menggunakan Toast di dalam aplikasi sebagai cadangan.",
          type: "info"
        });
      }
    } catch (e) {
      addToast({
        title: "Notifikasi Browser Dibatasi",
        message: "Izin dibatasi dalam iframe. In-app toast visual & audio alarm aktif!",
        type: "info"
      });
    }
  };

  const handleTriggerMockUpcomingReminder = () => {
    const activeOrScheduled = meetings.find((m) => m.status === "Scheduled") || meetings[0];
    const targetMtg = {
      ...activeOrScheduled,
      title: activeOrScheduled?.title || "Evaluasi Keamanan IT & Backup Cloud",
      startTime: "10:00",
      endTime: "11:30",
      locationDetail: activeOrScheduled?.locationDetail || "Zoom Link / Ruang VIP Rinjani",
      project: activeOrScheduled?.project || "Sistem Keamanan IT",
      meetingLink: "https://zoom.us/j/9876543210"
    };

    addToast({
      title: "📢 Pengingat: Rapat dalam 15 menit",
      message: `"${targetMtg.title}" akan segera dimulai di ${targetMtg.locationDetail}.`,
      type: "meeting",
      meeting: targetMtg,
      duration: 15000
    });
  };

  const handleTriggerMockStartReminder = () => {
    const activeOrScheduled = meetings.find((m) => m.status === "Scheduled") || meetings[0];
    const targetMtg = {
      ...activeOrScheduled,
      title: activeOrScheduled?.title || "Evaluasi Keamanan IT & Backup Cloud",
      startTime: "Sekarang",
      endTime: "Selesai",
      locationDetail: activeOrScheduled?.locationDetail || "Google Meet Link",
      project: activeOrScheduled?.project || "Sistem Keamanan IT",
      meetingLink: "https://meet.google.com/abc-defg-hij"
    };

    addToast({
      title: "🚨 Rapat Dimulai Sekarang!",
      message: `"${targetMtg.title}" sedang berlangsung. Klik 'Luncurkan Rapat' untuk langsung bergabung!`,
      type: "meeting",
      meeting: targetMtg,
      duration: 15000
    });
  };

  // Custom templates states
  const [customTemplates, setCustomTemplates] = useState<CustomMeetingTemplate[]>(() => {
    const saved = localStorage.getItem("fgi_custom_meeting_templates");
    return saved ? JSON.parse(saved) : [];
  });
  const [templateTab, setTemplateTab] = useState<"system" | "custom">("system");
  const [showSaveTemplateForm, setShowSaveTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  // Persist custom templates
  React.useEffect(() => {
    localStorage.setItem("fgi_custom_meeting_templates", JSON.stringify(customTemplates));
  }, [customTemplates]);

  // Form states
  const [title, setTitle] = useState("");
  const [isAddingNewProject, setIsAddingNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [type, setType] = useState<MeetingType>("Project Review");
  const [date, setDate] = useState("2026-07-06");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [locationType, setLocationType] = useState<LocationType>("Hybrid");
  const [locationDetail, setLocationDetail] = useState("");
  const [project, setProject] = useState("");
  const [goal, setGoal] = useState("");
  const [agenda, setAgenda] = useState("");
  const [hostId, setHostId] = useState("");
  const [moderatorId, setModeratorId] = useState("");
  const [notulisId, setNotulisId] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [attachmentsInput, setAttachmentsInput] = useState<{ name: string; size: string }[]>([]);

  // Filtering meetings
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.meetingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !project || !agenda) return;

    const randomIDNum = Math.floor(Math.random() * 900) + 100;
    const mtgNum = `MTG-2026-${String(new Date(date).getMonth() + 1).padStart(2, "0")}-${randomIDNum}`;

    // Auto generate conferencing link if online/hybrid
    let meetingLink = "";
    if (locationType === "Online" || locationType === "Hybrid") {
      meetingLink = `https://meet.google.com/fgi-${randomIDNum}-meeting`;
    }

    const newMtg: Meeting = {
      id: `mtg-${Date.now()}`,
      meetingNumber: mtgNum,
      title,
      type,
      date,
      startTime,
      endTime,
      locationType,
      locationDetail: locationDetail || (locationType === "Online" ? "Google Meet" : "Ruang Merbabu"),
      meetingLink,
      project,
      goal,
      agenda,
      hostId: hostId || currentUser.id,
      moderatorId: moderatorId || users[1]?.id || currentUser.id,
      notulisId: notulisId || users[0]?.id || currentUser.id,
      participantIds: selectedParticipants.length ? selectedParticipants : [currentUser.id],
      attachments: attachmentsInput.map((a, idx) => ({
        id: `att-add-${idx}`,
        name: a.name,
        size: a.size,
        type: a.name.split(".").pop() || "pdf"
      })),
      status: "Scheduled",
      transcript: [],
      liveNotes: "",
      polls: [],
      chat: []
    };

    addMeeting(newMtg);
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setProject("");
    setGoal("");
    setAgenda("");
    setLocationDetail("");
    setAttachmentsInput([]);
    setSelectedParticipants([]);
    setIsAddingNewProject(false);
    setNewProjectName("");
  };

  const handleToggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomTemplates(customTemplates.filter((tpl) => tpl.id !== id));
  };

  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTpl: CustomMeetingTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDesc || `Template agenda untuk ${project || "Proyek Umum"}`,
      title: title || "Rapat Koordinasi",
      type: type,
      startTime: startTime,
      endTime: endTime,
      locationType: locationType,
      locationDetail: locationDetail,
      project: project,
      goal: goal,
      agenda: agenda || "",
      selectedParticipants: selectedParticipants
    };

    setCustomTemplates([newTpl, ...customTemplates]);
    setNewTemplateName("");
    setNewTemplateDesc("");
    setShowSaveTemplateForm(false);
  };

  // Mock file selector action
  const handleMockUpload = () => {
    const mockFiles = [
      { name: "SOP_Keamanan_Data_Core_v3.pdf", size: "1.2 MB" },
      { name: "Draf_Anggaran_Struktur_Lantai5.xlsx", size: "850 KB" },
      { name: "Slide_Presentasi_Kickoff.pptx", size: "4.5 MB" }
    ];
    const chosen = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    if (!attachmentsInput.some((f) => f.name === chosen.name)) {
      setAttachmentsInput([...attachmentsInput, chosen]);
    }
  };

  const isAllowedToSchedule = [UserRole.SUPER_ADMIN, UserRole.DIREKTUR, UserRole.MANAGER].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Upper controls block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Penjadwalan & Rapat</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Atur jadwal, kelola delegasi pimpinan, dan selenggarakan rapat dengan asisten AI.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === "calendar" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarDays size={16} />
            </button>
          </div>

          {isAllowedToSchedule && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-blue-600/15 cursor-pointer"
            >
              <Plus size={14} /> Buat Jadwal Rapat
            </button>
          )}
        </div>
      </div>

      {/* Reminder Control Hub & Simulation Widget */}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-900/60 dark:to-indigo-950/20 border border-blue-100/40 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl text-indigo-500 shadow-sm border border-indigo-100/50 dark:border-slate-800 shrink-0">
            <Bell size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Pusat Pengingat & Notifikasi Rapat
              <span className="text-[9px] font-extrabold bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">Aktif</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Sistem memindai rapat terjadwal secara real-time dan memberikan peringatan toast & audio double-chime 15 menit sebelum acara.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px]">
              <button
                type="button"
                onClick={handleTogglePushNotifications}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 font-semibold transition-all cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full ${pushEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                Push Notif Browser: {pushEnabled ? "Diaktifkan" : "Klik untuk Aktifkan"}
              </button>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">Offset Pengingat Rapat: 15 Menit</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTriggerMockUpcomingReminder}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
          >
            <Volume2 size={13} />
            Simulasi Pengingat
          </button>
          
          <button
            type="button"
            onClick={handleTriggerMockStartReminder}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/10"
          >
            <Sparkles size={13} />
            Simulasi Rapat Mulai
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan judul, kode MTG, proyek, atau agenda..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">Semua Tipe Rapat</option>
            <option value="Operational">Operational</option>
            <option value="Strategic">Strategic</option>
            <option value="Project Review">Project Review</option>
            <option value="Client Board">Client Board</option>
            <option value="Vendor Alignment">Vendor Alignment</option>
          </select>
        </div>
      </div>

      {/* List / Calendar Renders */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map((mtg) => (
              <div
                key={mtg.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm hover:border-blue-400/40 dark:hover:border-blue-400/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                      {mtg.meetingNumber}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      {mtg.type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        mtg.status === "Completed"
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                          : mtg.status === "Ongoing"
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse"
                          : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {mtg.status === "Completed" ? "Selesai" : mtg.status === "Ongoing" ? "Berjalan" : "Terjadwal"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{mtg.title}</h3>

                  {/* Metadata labels */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      <span>{mtg.date} • {mtg.startTime} - {mtg.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase size={12} className="text-slate-400" />
                      <span>Proyek: <strong className="text-slate-600 dark:text-slate-300">{mtg.project}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      {mtg.locationType === "Online" ? (
                        <Video size={12} className="text-slate-400" />
                      ) : (
                        <MapPin size={12} className="text-slate-400" />
                      )}
                      <span>{mtg.locationDetail}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end lg:self-center">
                  {/* Join/Host launch button */}
                  {mtg.status !== "Completed" ? (
                    <button
                      onClick={() => onLaunchMeeting(mtg)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Video size={14} /> {mtg.status === "Ongoing" ? "Gabung Konsol Live" : "Mulai Rapat (AI)"}
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedCompletedMeeting(mtg)}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-750 flex items-center gap-1.5 cursor-pointer transition-all duration-150 shadow-sm"
                        title="Tampilkan Detail Minutes of Meeting"
                      >
                        <FileText size={13} className="text-slate-500" />
                        <span>Tampilkan MoM</span>
                      </button>
                      
                      <button
                        onClick={() => exportMeetingToPDF(mtg, users)}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/15 flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Unduh Berita Acara PDF Resmi"
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Tidak ada jadwal rapat yang cocok dengan filter aktif.</p>
            </div>
          )}
        </div>
      )}

      {/* Mock Calendar Grid View */}
      {viewMode === "calendar" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Jadwal Kalender: Juli 2026</h3>
            <span className="text-[10px] text-slate-400">Drag & Drop schedule is active</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day) => (
              <div key={day} className="text-[10px] font-bold text-slate-400 uppercase py-1">{day}</div>
            ))}

            {/* Empty days block */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-slate-50/40 dark:bg-slate-800/10 rounded-xl"></div>
            ))}

            {/* Days list */}
            {Array.from({ length: 15 }).map((_, idx) => {
              const dayNum = idx + 1;
              const hasMeeting = dayNum === 5 || dayNum === 6;
              return (
                <div
                  key={idx}
                  className={`p-1.5 aspect-square bg-slate-50 dark:bg-slate-800/40 rounded-xl flex flex-col justify-between text-left border border-transparent hover:border-slate-200 ${
                    dayNum === 5 ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/15" : ""
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-400">{dayNum}</span>
                  {hasMeeting && (
                    <div className="text-[9px] bg-blue-600 text-white p-1 rounded font-semibold truncate">
                      {dayNum === 5 ? "Rapat IT & ERP" : "Proyek Lantai 5"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Dialog Box Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CalendarDays className="text-blue-600 w-4 h-4" />
                Buat Agenda Rapat Baru
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-6 overflow-y-auto space-y-4">
              
              {/* Meeting Template Selector */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <Sparkles size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Template Agenda & Peserta Rapat
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Isi draf agenda & daftar peserta rapat instan secara otomatis
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200/50 dark:border-slate-800/60 gap-4 text-xs pb-1">
                  <button
                    type="button"
                    onClick={() => setTemplateTab("system")}
                    className={`pb-1 font-semibold transition-all border-b-2 cursor-pointer ${
                      templateTab === "system"
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    Template Sistem
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateTab("custom")}
                    className={`pb-1 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                      templateTab === "custom"
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    Template Kustom ({customTemplates.length})
                  </button>
                </div>
                
                {templateTab === "system" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {MEETING_TEMPLATES.map((tpl) => {
                      let IconComponent = CalendarDays;
                      if (tpl.id === "weekly_standup") IconComponent = Clock;
                      if (tpl.id === "project_review") IconComponent = Briefcase;
                      if (tpl.id === "client_briefing") IconComponent = Video;
                      
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setTitle(tpl.title);
                            setType(tpl.type);
                            setStartTime(tpl.startTime);
                            setEndTime(tpl.endTime);
                            setLocationType(tpl.locationType);
                            setLocationDetail(tpl.locationDetail);
                            setAgenda(tpl.agenda);
                            setSelectedParticipants([]);
                          }}
                          className="p-3 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850/70 hover:border-indigo-500 dark:hover:border-indigo-500/60 rounded-xl text-left hover:shadow-md transition-all duration-200 group flex items-start gap-3 cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                            <IconComponent size={16} />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block truncate">
                              {tpl.name}
                            </span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                              {tpl.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {customTemplates.length === 0 ? (
                      <div className="text-center py-5 px-3 bg-white dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Belum ada template kustom.
                        </p>
                        <p className="text-[10px] text-slate-400/80 dark:text-slate-500/80 mt-1">
                          Isi draf rapat di bawah lalu klik tombol <strong className="text-indigo-500">Simpan sbg Template</strong> di pojok kanan bawah untuk menyimpannya di sini.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto">
                        {customTemplates.map((tpl) => (
                          <div
                            key={tpl.id}
                            onClick={() => {
                              setTitle(tpl.title);
                              setType(tpl.type);
                              setStartTime(tpl.startTime);
                              setEndTime(tpl.endTime);
                              setLocationType(tpl.locationType);
                              setLocationDetail(tpl.locationDetail || "");
                              setProject(tpl.project || "");
                              setGoal(tpl.goal || "");
                              setAgenda(tpl.agenda);
                              setSelectedParticipants(tpl.selectedParticipants || []);
                            }}
                            className="p-3 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850/70 hover:border-indigo-500 dark:hover:border-indigo-500/60 rounded-xl text-left hover:shadow-md transition-all duration-200 group flex items-start justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-500 shrink-0">
                                <Sparkles size={16} />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block truncate">
                                  {tpl.name}
                                </span>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                                  {tpl.description}
                                </p>
                                <span className="inline-block text-[9px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded px-1 mt-1">
                                  {tpl.selectedParticipants?.length || 0} Peserta
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomTemplate(tpl.id, e)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-300 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors shrink-0 cursor-pointer"
                              title="Hapus template kustom"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Judul Rapat</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rapat Tinjauan Mingguan Keuangan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Proyek Utama</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewProject(!isAddingNewProject);
                        setNewProjectName("");
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {isAddingNewProject ? "← Pilih dari Daftar" : "+ Tambah Proyek Manual"}
                    </button>
                  </div>

                  {isAddingNewProject ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ketik nama proyek baru..."
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newProjectName.trim();
                          if (trimmed) {
                            addMasterItem("projects", trimmed);
                            setProject(trimmed);
                            setIsAddingNewProject(false);
                            setNewProjectName("");
                          }
                        }}
                        className="px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  ) : (
                    <select
                      value={project}
                      required
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          setIsAddingNewProject(true);
                          setNewProjectName("");
                        } else {
                          setProject(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="">Pilih Proyek...</option>
                      {masterData.projects.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      <option value="__add_new__" className="text-blue-600 dark:text-blue-400 font-bold">
                        + Tambah Proyek Baru...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Tipe Rapat</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MeetingType)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="Project Review">Project Review</option>
                    <option value="Operational">Operational</option>
                    <option value="Strategic">Strategic</option>
                    <option value="Client Board">Client Board</option>
                    <option value="Vendor Alignment">Vendor Alignment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Tanggal Rapat</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Mulai</label>
                    <input
                      type="text"
                      placeholder="10:00"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs focus:outline-none text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Selesai</label>
                    <input
                      type="text"
                      placeholder="11:30"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs focus:outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Jenis Kehadiran</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as LocationType)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="Hybrid">Hybrid (Offline + Online)</option>
                    <option value="Online">Online Virtual Only</option>
                    <option value="Offline">Tatap Muka Fisik Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Nama Ruangan / Link</label>
                  <input
                    type="text"
                    value={locationDetail}
                    onChange={(e) => setLocationDetail(e.target.value)}
                    placeholder="Contoh: Ruang VIP Rinjani / Zoom Link"
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Tujuan & Agenda Rapat</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ketik poin agenda pengerjaan rapat. Contoh:&#10;1. Tinjau kemajuan struktur kolom lantai 5&#10;2. Pengalokasian dana sewa truk mandiri..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Participants multi checklist selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Pilih Peserta Rapat</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/20">
                  {users.map((user) => {
                    const selected = selectedParticipants.includes(user.id);
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => handleToggleParticipant(user.id)}
                        className={`p-1.5 rounded-lg border text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                          selected
                            ? "bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate pr-1">{user.name}</span>
                        {selected && <Check size={11} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mock Attachments section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Unggah Lampiran MoM</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleMockUpload}
                    className="px-3.5 py-2.5 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-500 hover:text-blue-600 hover:border-blue-500 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <UploadCloud size={14} /> Tambah File Lampiran
                  </button>
                  {attachmentsInput.map((file, i) => (
                    <div key={i} className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 rounded-lg flex items-center gap-1.5 border border-slate-200">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachmentsInput(attachmentsInput.filter((_, idx) => idx !== i))}
                        className="text-red-500 font-bold hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                {showSaveTemplateForm ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 animate-fade-in">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-500" />
                      Simpan Pengaturan Rapat sebagai Template Baru
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      Agenda dan daftar peserta rapat yang terpilih saat ini akan disimpan untuk digunakan kembali nanti.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Nama Template</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Sinkronisasi Bulanan IT"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Deskripsi Singkat (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Contoh: Agenda rutin bulanan dan daftar PIC inti"
                          value={newTemplateDesc}
                          onChange={(e) => setNewTemplateDesc(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSaveTemplateForm(false);
                          setNewTemplateName("");
                          setNewTemplateDesc("");
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-600"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAsTemplate}
                        disabled={!newTemplateName.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer"
                      >
                        Simpan Template
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-between items-center gap-3">
                  {!showSaveTemplateForm && (
                    <button
                      type="button"
                      onClick={() => setShowSaveTemplateForm(true)}
                      className="px-4 py-2 text-xs font-semibold border border-indigo-200 hover:border-indigo-500 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles size={14} />
                      Simpan sbg Template
                    </button>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setShowSaveTemplateForm(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-600"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer"
                    >
                      Terbitkan Jadwal
                    </button>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* 8. Detailed Minutes of Meeting Preview Modal */}
      {selectedCompletedMeeting && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl max-w-3xl w-full h-[85vh] flex flex-col text-left animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Minutes of Meeting (MoM) Resmi
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Sistem Rapat & Dokumentasi AI Fokus Giga Indonesia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompletedMeeting(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Metadata Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3.5 bg-slate-50 dark:bg-slate-950/45 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block font-medium">KODE RAPAT</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">{selectedCompletedMeeting.meetingNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">TANGGAL & WAKTU</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedCompletedMeeting.date} ({selectedCompletedMeeting.startTime})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">TIPE / PROYEK</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedCompletedMeeting.type} • {selectedCompletedMeeting.project}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">STATUS DOKUMEN</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  TERBIT (AI)
                </span>
              </div>
            </div>

            {/* MoM Content Preview Area */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="bg-slate-950 text-slate-200 p-5 rounded-xl border border-slate-800/70 leading-relaxed font-sans text-xs whitespace-pre-wrap select-text h-full overflow-y-auto">
                {selectedCompletedMeeting.momMarkdown || "Kandungan risalah kosong."}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setSelectedCompletedMeeting(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300"
              >
                Tutup
              </button>
              
              <button
                type="button"
                onClick={() => {
                  exportMeetingToPDF(selectedCompletedMeeting, users);
                }}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/15 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Download size={14} /> Unduh PDF Resmi (MoM)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
