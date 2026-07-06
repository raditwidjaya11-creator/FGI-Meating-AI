/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole, Meeting, Decision, ActionItem, MasterData } from "./types";

export const DEFAULT_USERS: User[] = [
  {
    id: "usr-1",
    name: "Radit Widjaya",
    email: "raditwidjaya11@gmail.com",
    phone: "+62 812-3456-7890",
    role: UserRole.SUPER_ADMIN,
    department: "Teknologi Informasi",
    division: "Core Platform",
    company: "FGi Enterprise",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces"
  },
  {
    id: "usr-2",
    name: "Ahmad Subagio",
    email: "ahmad.subagio@fgi.co.id",
    phone: "+62 811-9876-5432",
    role: UserRole.DIREKTUR,
    department: "Direksi",
    division: "Executive Board",
    company: "FGi Enterprise",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces"
  },
  {
    id: "usr-3",
    name: "Siti Rahmawati",
    email: "siti.rahma@fgi.co.id",
    phone: "+62 813-1122-3344",
    role: UserRole.MANAGER,
    department: "Operasional",
    division: "Manajemen Proyek",
    company: "FGi Enterprise",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces"
  },
  {
    id: "usr-4",
    name: "Budi Santoso",
    email: "budi.santoso@fgi.co.id",
    phone: "+62 815-5566-7788",
    role: UserRole.SUPERVISOR,
    department: "Teknik & Infrastruktur",
    division: "Sipil & Konstruksi",
    company: "FGi Enterprise",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces"
  },
  {
    id: "usr-5",
    name: "Diana Lestari",
    email: "diana.lestari@fgi.co.id",
    phone: "+62 819-2233-4455",
    role: UserRole.STAFF,
    department: "Operasional",
    division: "Konstruksi Lapangan",
    company: "FGi Enterprise",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces"
  },
  {
    id: "usr-6",
    name: "Michael Chen",
    email: "michael.chen@client.com",
    role: UserRole.GUEST,
    phone: "+65 9123-4567",
    department: "Eksternal",
    division: "Foresyndo Holdings",
    company: "Foresyndo Group",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces"
  }
];

export const DEFAULT_MASTER_DATA: MasterData = {
  departments: [
    "Direksi",
    "Teknologi Informasi",
    "Operasional",
    "Keuangan & Akuntansi",
    "Sumber Daya Manusia",
    "Pemasaran & Penjualan",
    "Hukum & Kepatuhan"
  ],
  divisions: [
    "Executive Board",
    "Core Platform",
    "Manajemen Proyek",
    "Sipil & Konstruksi",
    "Konstruksi Lapangan",
    "Treasury & Budgeting",
    "Talent Acquisition"
  ],
  rooms: [
    "Ruang Merbabu (Lantai 2)",
    "Ruang Rinjani (Lantai 3 - VIP)",
    "Ruang Bromo (Lantai 1)",
    "Ruang Hall Nusantara (Lantai Penthouse)",
    "Studio Kreatif (Lantai 4)"
  ],
  clients: [
    "Foresyndo Holdings",
    "Adhi Karya Group",
    "Gojek Tokopedia",
    "Telkom Indonesia"
  ],
  projects: [
    "Proyek Foresyndo Struktur Lantai 5",
    "Migrasi Core ERP FGi-V2",
    "Audit Kepatuhan Lingkungan Hidup",
    "Kampanye Pemasaran Triwulan II"
  ],
  vendors: [
    "PT Semen Indonesia",
    "PT Waskita Beton Precast",
    "Oracle Indonesia",
    "Microsoft Cloud Enterprise"
  ],
  templates: [
    {
      id: "tmp-1",
      name: "Template Agenda Rapat Kick-off",
      type: "Agenda",
      content: `1. Pembukaan oleh Moderator (5 menit)
2. Sambutan Pimpinan Rapat / Direktur (10 menit)
3. Presentasi Ruang Lingkup Proyek & Target (20 menit)
4. Pembagian Peran & Tanggung Jawab (15 menit)
5. Sesi Diskusi & Tanya Jawab (25 menit)
6. Penutup & Kesimpulan Rencana Aksi (10 menit)`
    },
    {
      id: "tmp-2",
      name: "Template MoM Rapat Direksi",
      type: "MoM",
      content: `## MINUTES OF MEETING (MoM)
### 1. INFORMASI RAPAT
- Pimpinan:
- Notulis:
### 2. DAFTAR HADIR
### 3. DETAIL PEMBAHASAN
### 4. MATRIKS KEPUTUSAN (DECISION MATRIX)
### 5. RENCANA AKSI (ACTION PLAN)
### 6. TANDA TANGAN DIGITAL`
    }
  ]
};

export const DEFAULT_MEETINGS: Meeting[] = [
  {
    id: "mtg-1",
    meetingNumber: "MTG-2026-06-001",
    title: "Rapat Penyelarasan Struktur Proyek Foresyndo Lantai 5",
    type: "Project Review",
    date: "2026-06-21",
    startTime: "10:00",
    endTime: "11:30",
    locationType: "Hybrid",
    locationDetail: "Ruang Rinjani (Lantai 3 - VIP) & Zoom Link",
    meetingLink: "https://zoom.us/j/9876543210",
    project: "Proyek Foresyndo Struktur Lantai 5",
    goal: "Menyelesaikan hambatan pasokan beton pracetak dan mempercepat pengerjaan struktur lantai 5.",
    agenda: `1. Review progress pengerjaan kolom utama lantai 5.
2. Evaluasi keterlambatan pengiriman semen cor oleh PT Semen Indonesia.
3. Diskusi realokasi anggaran operasional darurat.
4. Penetapan penanggung jawab (PIC) pengawasan lapangan harian.`,
    hostId: "usr-2", // Ahmad Subagio
    moderatorId: "usr-3", // Siti Rahmawati
    notulisId: "usr-1", // Radit (Super Admin / IT)
    participantIds: ["usr-1", "usr-2", "usr-3", "usr-4", "usr-5", "usr-6"],
    attachments: [
      { id: "att-1", name: "Rancangan_Struktur_Lantai5_Final.pdf", size: "14.2 MB", type: "pdf" },
      { id: "att-2", name: "Rencana_Anggaran_Operasional_Darurat.xlsx", size: "2.4 MB", type: "xlsx" }
    ],
    status: "Completed",
    durationMinutes: 90,
    liveNotes: `Pembahasan kolom utama selesai 85%. Kendala utama ada pada pengiriman material pracetak dari vendor PT Semen Indonesia. Budi Santoso menyarankan mempercepat koordinasi logistik. Pak Ahmad Subagio menginstruksikan persetujuan biaya tambahan operasional jika mempercepat waktu. Rapat setuju menunjuk Diana Lestari sebagai koordinator harian di lapangan untuk lantai 5.`,
    polls: [],
    chat: [],
    transcript: [
      { timestamp: "10:05", speakerName: "Ahmad Subagio", speakerRole: "Direktur", text: "Selamat pagi semua. Hari ini kita harus selesaikan kendala di Proyek Foresyndo Lantai 5. Keterlambatan material beton sudah kritis." },
      { timestamp: "10:08", speakerName: "Budi Santoso", speakerRole: "Supervisor", text: "Siap Pak Ahmad. Saat ini kendala beton pracetak dikarenakan antrean pengiriman dari PT Semen Indonesia yang terhambat di jalur utama." },
      { timestamp: "10:15", speakerName: "Siti Rahmawati", speakerRole: "Manager", text: "Betul Pak. Kami membutuhkan keputusan terkait anggaran tambahan operasional untuk sewa armada pengangkut mandiri agar mempercepat pengiriman." },
      { timestamp: "10:25", speakerName: "Ahmad Subagio", speakerRole: "Direktur", text: "Saya setuju dan berikan approval anggaran tambahan darurat maksimal 150 juta rupiah untuk armada logistik mandiri." },
      { timestamp: "10:45", speakerName: "Michael Chen", speakerRole: "Guest (Client)", text: "Terima kasih respon cepatnya. Kami sangat membutuhkan penyelesaian struktur kolom lantai 5 ini sebelum akhir bulan depan." },
      { timestamp: "11:00", speakerName: "Ahmad Subagio", speakerRole: "Direktur", text: "Budi, pastikan Anda dan Diana Lestari awasi ini setiap hari secara ketat di lapangan." }
    ],
    momMarkdown: `## MINUTES OF MEETING (MoM)
**ID RAPAT:** MTG-2026-06-001 | **JUDUL:** Rapat Penyelarasan Struktur Proyek Foresyndo Lantai 5
**TANGGAL:** 2026-06-21 | **STATUS:** SELESAI

### 1. INFORMASI RAPAT
- **Host / Pimpinan Rapat:** Ahmad Subagio (Direktur)
- **Notulis:** Radit Widjaya
- **Kehadiran:** 6 Peserta Terdaftar (Ahmad, Siti, Radit, Budi, Diana, Michael Chen)
- **Agenda Utama:** Hambatan Pasokan Material Beton & Percepatan Konstruksi Lantai 5

### 2. PEMBAHASAN UTAMA & RINGKASAN DISKUSI
- Progress fisik kolom utama lantai 5 dilaporkan berada di posisi 85%. Kendala terbesar adalah pasokan beton dari PT Semen Indonesia yang terhambat masalah armada.
- Diusulkan pengadaan armada logistik mandiri (sewa tambahan) agar lepas dari antrean jalur vendor reguler.
- Biaya operasional tambahan disepakati untuk dialokasikan demi kepastian progress proyek.

### 3. DAFTAR KEPUTUSAN STRUKTUR (DECISION MATRIX)
- **DEC-001**: Menyetujui alokasi dana darurat operasional maksimal Rp 150.000.000,- untuk mempercepat pengiriman logistik beton cor.
  - *Prioritas:* Tinggi
  - *Status:* Disetujui
  - *PIC:* Siti Rahmawati (Manager Operasional)

### 4. ACTION PLAN & TINDAK LANJUT
- **TSK-001**: Melakukan negosiasi sewa armada logistik mandiri dan koordinasi bypass antrean dengan PT Semen Indonesia.
  - *PIC:* Siti Rahmawati (Manager)
  - *Deadline:* 2026-06-25
  - *Progress:* 100% (Completed)
- **TSK-002**: Pengawasan lapangan harian yang intensif untuk pengerjaan kolom utama lantai 5 secara langsung di lokasi.
  - *PIC:* Budi Santoso (Supervisor) & Diana Lestari (Staff)
  - *Deadline:* 2026-07-10
  - *Progress:* 80% (In Progress)

### 5. REKOMENDASI AI
- **Analisis Sentimen:** Sangat Positif & Kolaboratif (100% sepakat).
- ** ROI Rapat:** Tinggi - Penyelarasan ini mencegah potensi denda keterlambatan proyek sebesar Rp 45.000.000,- per hari.`
  },
  {
    id: "mtg-2",
    meetingNumber: "MTG-2026-07-002",
    title: "Koordinasi Rutin ERP & Keamanan Sistem IT",
    type: "Operational",
    date: "2026-07-05",
    startTime: "09:00",
    endTime: "10:30",
    locationType: "Online",
    locationDetail: "Google Meet Link",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    project: "Migrasi Core ERP FGi-V2",
    goal: "Membahas keamanan database migrasi dan audit log aktivitas pasca update.",
    agenda: `1. Review status keamanan backup server cloud.
2. Pembahasan policy multi-factor authentication (MFA).
3. Evaluasi integrasi data dengan divisi keuangan.`,
    hostId: "usr-1", // Radit
    moderatorId: "usr-1",
    notulisId: "usr-3",
    participantIds: ["usr-1", "usr-3", "usr-4"],
    attachments: [
      { id: "att-3", name: "Security_Audit_Report_v2.pdf", size: "4.1 MB", type: "pdf" }
    ],
    status: "Ongoing",
    polls: [],
    chat: [],
    transcript: [],
    liveNotes: "Rapat sedang berjalan. Radit mempresentasikan dashboard enkripsi data dan penyiapan sistem Multi-Factor Authentication (MFA) untuk seluruh role."
  }
];

export const DEFAULT_DECISIONS: Decision[] = [
  {
    id: "dec-1",
    decisionNumber: "DEC-2026-001",
    date: "2026-06-21",
    meetingId: "mtg-1",
    meetingTitle: "Rapat Penyelarasan Struktur Proyek Foresyndo Lantai 5",
    description: "Menyetujui anggaran darurat maksimal Rp 150.000.000,- untuk penyewaan 5 armada truk logistik mandiri guna bypass antrean material di PT Semen Indonesia.",
    priority: "High",
    category: "Anggaran & Logistik",
    status: "Approved",
    picId: "usr-3", // Siti Rahmawati
    targetDate: "2026-06-25",
    signatures: [
      { userId: "usr-2", userName: "Ahmad Subagio", timestamp: "2026-06-21 11:15", signatureData: "Signed_Ahmad_Subagio_BoardApproved" },
      { userId: "usr-3", userName: "Siti Rahmawati", timestamp: "2026-06-21 11:20", signatureData: "Signed_Siti_Rahma_PicConfirmed" }
    ],
    attachments: ["Rencana_Anggaran_Operasional_Darurat.xlsx"],
    history: [
      { date: "2026-06-21 10:45", userId: "usr-1", userName: "Radit Widjaya", action: "Membuat draf keputusan rapat" },
      { date: "2026-06-21 11:15", userId: "usr-2", userName: "Ahmad Subagio", action: "Menandatangani keputusan (Menyetujui)" }
    ]
  }
];

export const DEFAULT_ACTION_ITEMS: ActionItem[] = [
  {
    id: "tsk-1",
    taskNumber: "TSK-2026-001",
    name: "Negosiasi dan Sewa Armada Truk Logistik Mandiri",
    picId: "usr-3", // Siti Rahmawati
    deadline: "2026-06-25",
    progress: 100,
    status: "Completed",
    priority: "High",
    meetingId: "mtg-1",
    meetingTitle: "Rapat Penyelarasan Struktur Proyek Foresyndo Lantai 5",
    checklist: [
      { id: "chk-1", text: "Hubungi vendor armada logistik eksternal PT Cepat Angkut", done: true },
      { id: "chk-2", text: "Buat SPK sewa armada untuk 5 unit truk", done: true },
      { id: "chk-3", text: "Konfirmasi rute bypass dengan tim PT Semen Indonesia", done: true }
    ],
    evidenceNote: "SPK telah ditandatangani dan 5 truk telah mulai mengangkut material beton langsung pada 22 Juni 2026.",
    evidenceUrl: "SPK_Logistik_Sewa_Truk.pdf"
  },
  {
    id: "tsk-2",
    taskNumber: "TSK-2026-002",
    name: "Pengawasan Lapangan Harian Struktur Kolom Lantai 5",
    picId: "usr-4", // Budi Santoso
    deadline: "2026-07-10",
    progress: 80,
    status: "In Progress",
    priority: "High",
    meetingId: "mtg-1",
    meetingTitle: "Rapat Penyelarasan Struktur Proyek Foresyndo Lantai 5",
    checklist: [
      { id: "chk-4", text: "Inspeksi bekisting kolom utama", done: true },
      { id: "chk-5", text: "Monitoring pengecoran beton harian", done: true },
      { id: "chk-6", text: "Laporan kemajuan mingguan dikirim ke Direktur", done: false }
    ]
  },
  {
    id: "tsk-3",
    taskNumber: "TSK-2026-003",
    name: "Finalisasi Skema Backup Enkripsi Server ERP FGi-V2",
    picId: "usr-1", // Radit
    deadline: "2026-07-15",
    progress: 30,
    status: "In Progress",
    priority: "Medium",
    meetingId: "mtg-2",
    meetingTitle: "Koordinasi Rutin ERP & Keamanan Sistem IT",
    checklist: [
      { id: "chk-7", text: "Aktifkan enkripsi AES-256 pada database postgresql", done: true },
      { id: "chk-8", text: "Uji coba disaster recovery restore", done: false },
      { id: "chk-9", text: "Dokumentasi SOP backup mingguan", done: false }
    ]
  }
];
