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
  Download
} from "lucide-react";
import { exportMeetingToPDF } from "../utils/pdfExport";

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
  const { meetings, addMeeting, users, masterData, currentUser, addMasterItem } = useApp();
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "timeline">("list");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [selectedCompletedMeeting, setSelectedCompletedMeeting] = useState<Meeting | null>(null);

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
                        Gunakan Template Agenda Instan
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Pilih struktur rapat prafabrikasi untuk mengisi draf formulir secara otomatis
                      </p>
                    </div>
                  </div>
                </div>
                
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
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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
