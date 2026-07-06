/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  DIREKTUR = "Direktur",
  MANAGER = "Manager",
  SUPERVISOR = "Supervisor",
  STAFF = "Staff",
  GUEST = "Guest"
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  division: string;
  company: string;
  avatar: string;
  signature?: string; // Base64 signature
  isPresent?: boolean;
  attendanceType?: "Online" | "Offline" | "Absent";
  checkInTime?: string;
  qrCode?: string; // Simulated QR content
}

export type MeetingType = "Operational" | "Strategic" | "Project Review" | "Client Board" | "Vendor Alignment";
export type MeetingStatus = "Scheduled" | "Ongoing" | "Completed" | "Postponed";
export type LocationType = "Online" | "Offline" | "Hybrid";

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  active: boolean;
  votedUserIds: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface MeetingTranscriptLine {
  timestamp: string;
  speakerName: string;
  speakerRole: string;
  text: string;
  language?: string;
}

export interface Meeting {
  id: string;
  meetingNumber: string;
  title: string;
  type: MeetingType;
  date: string;
  startTime: string;
  endTime: string;
  locationType: LocationType;
  locationDetail: string; // e.g. Room Merbabu, Zoom Link, Teams Link
  meetingLink?: string;
  project: string;
  goal: string;
  agenda: string; // Markdown or plain text list
  hostId: string;
  moderatorId: string;
  notulisId: string;
  participantIds: string[];
  attachments: Attachment[];
  status: MeetingStatus;
  transcript: MeetingTranscriptLine[];
  liveNotes: string;
  momMarkdown?: string;
  polls: Poll[];
  chat: ChatMessage[];
  durationMinutes?: number;
}

export interface DecisionHistory {
  date: string;
  userId: string;
  userName: string;
  action: string;
}

export interface Decision {
  id: string;
  decisionNumber: string;
  date: string;
  meetingId: string;
  meetingTitle: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  category: string;
  status: "Draft" | "Under Review" | "Approved" | "Rejected" | "Pending" | "Implemented";
  picId: string;
  targetDate: string;
  signatures: { userId: string; userName: string; timestamp: string; signatureData: string }[];
  attachments: string[];
  history: DecisionHistory[];
  isOffline?: boolean;
  syncPending?: boolean;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActionItem {
  id: string;
  taskNumber: string;
  name: string;
  picId: string;
  deadline: string;
  progress: number; // 0 to 100
  checklist: TaskChecklistItem[];
  status: "Not Started" | "In Progress" | "In Review" | "Completed";
  evidenceUrl?: string; // base64 or mock file path
  evidenceNote?: string;
  meetingId: string;
  meetingTitle: string;
  priority: "High" | "Medium" | "Low";
  approvedBy?: string;
  isOffline?: boolean;
  syncPending?: boolean;
}

export interface MasterData {
  departments: string[];
  divisions: string[];
  rooms: string[];
  clients: string[];
  projects: string[];
  vendors: string[];
  templates: {
    id: string;
    name: string;
    type: "Agenda" | "MoM" | "Decision" | "ActionPlan";
    content: string;
  }[];
}

export interface Delegation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  meetingId: string;
  meetingTitle: string;
  date: string;
  reason: string;
  status: "Approved" | "Pending" | "Rejected";
}

