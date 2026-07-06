import { jsPDF } from "jspdf";
import { Meeting, User } from "../types";

/**
 * Strips markdown symbols like asterisks for clean text rendering
 */
const cleanMarkdownSymbols = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1")     // italic
    .replace(/__(.*?)__/g, "$1")     // bold underscore
    .replace(/_(.*?)_/g, "$1")       // italic underscore
    .replace(/`(.*?)`/g, "$1")       // inline code
    .trim();
};

/**
 * Checks if a line contains bold text elements and splits it into style segments
 */
interface TextSegment {
  text: string;
  isBold: boolean;
}

const parseInlineStyles = (line: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: line.substring(lastIndex, match.index),
        isBold: false,
      });
    }
    segments.push({
      text: match[1],
      isBold: true,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    segments.push({
      text: line.substring(lastIndex),
      isBold: false,
    });
  }

  return segments.length > 0 ? segments : [{ text: line, isBold: false }];
};

/**
 * Generates an enterprise-ready PDF document for a meeting's MoM
 */
export const exportMeetingToPDF = (meeting: Meeting, users: User[]) => {
  // Create PDF: Portrait, millimeters, A4 size (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN_LEFT = 20;
  const MARGIN_RIGHT = 20;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 170mm
  const BOTTOM_LIMIT = 265; // Margin bottom 32mm

  let y = 25; // Starting top coordinate for content on Page 1

  // Resolve key personnel names
  const hostUser = users.find((u) => u.id === meeting.hostId);
  const hostName = hostUser ? `${hostUser.name} (${hostUser.role})` : "Pimpinan Rapat";
  
  const notulisUser = users.find((u) => u.id === meeting.notulisId);
  const notulisName = notulisUser ? `${notulisUser.name} (${notulisUser.role})` : "Notulis Rapat";

  const moderatorUser = users.find((u) => u.id === meeting.moderatorId);
  const moderatorName = moderatorUser ? `${moderatorUser.name} (${moderatorUser.role})` : "-";

  // Resolve attendees names
  const attendeesList = meeting.participantIds
    .map((id) => {
      const u = users.find((user) => user.id === id);
      return u ? `${u.name} [${u.role} - ${u.division || "Tim"}]` : null;
    })
    .filter(Boolean) as string[];

  // ----------------------------------------------------
  // Page check helper to handle automatic pagination
  // ----------------------------------------------------
  const checkPageOverflow = (heightNeeded: number) => {
    if (y + heightNeeded > BOTTOM_LIMIT) {
      doc.addPage();
      y = 30; // Reset y for new page (leaves spacing for header)
      return true;
    }
    return false;
  };

  // ----------------------------------------------------
  // FIRST PASS: Render the main contents
  // ----------------------------------------------------

  // 1. Brand Logo & Document Title Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229); // indigo-600 accent
  doc.text("FOKUS GIGA INDONESIA", MARGIN_LEFT, y);
  
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("MINUTES OF MEETING (MoM)", MARGIN_LEFT, y);

  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Dokumen Berita Acara & Risalah Hasil Rapat Resmi Perusahaan", MARGIN_LEFT, y);

  y += 4;
  // Elegant line separators
  doc.setDrawColor(79, 70, 229); // indigo accent
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  
  y += 1.2;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

  y += 8;

  // 2. Corporate Metadata Grid Block (2x4 columns layout)
  checkPageOverflow(50);
  doc.setFillColor(248, 250, 252); // slate-50 / off-white bg
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 42, "F");
  
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 42, "S");

  // Inner lines for structured table look
  doc.line(MARGIN_LEFT + 85, y, MARGIN_LEFT + 85, y + 42); // Vertical mid division
  for (let i = 1; i <= 3; i++) {
    doc.line(MARGIN_LEFT, y + (i * 10.5), MARGIN_LEFT + CONTENT_WIDTH, y + (i * 10.5)); // Horizontal rows
  }

  // Draw metadata labels & values
  doc.setFontSize(8.5);
  const drawMetaCell = (col: 0 | 1, row: number, label: string, val: string) => {
    const startX = MARGIN_LEFT + (col === 0 ? 3 : 88);
    const textY = y + (row * 10.5) + 6.5;
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(label, startX, textY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42); // slate-900
    const labelWidth = doc.getTextWidth(label) + 2;
    doc.text(val, startX + labelWidth, textY, { maxWidth: 85 - labelWidth - 5 });
  };

  drawMetaCell(0, 0, "Topik Rapat:", meeting.title);
  drawMetaCell(0, 1, "Kode Rapat:", meeting.meetingNumber);
  drawMetaCell(0, 2, "Tipe Rapat:", meeting.type);
  drawMetaCell(0, 3, "Proyek:", meeting.project);

  drawMetaCell(1, 0, "Tanggal:", meeting.date);
  drawMetaCell(1, 1, "Waktu:", `${meeting.startTime} - ${meeting.endTime}`);
  drawMetaCell(1, 2, "Notulis:", notulisUser ? notulisUser.name : "Notulis Rapat");
  drawMetaCell(1, 3, "Pimpinan:", hostUser ? hostUser.name : "Pimpinan Rapat");

  y += 50;

  // 3. Meeting Objective Block (Goal)
  checkPageOverflow(25);
  doc.setFillColor(239, 246, 255); // blue-50 bg
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 18, "F");
  
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(1.2);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT, y + 18); // Left thick accent line
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text("OBJEKTIF UTAMA RAPAT (GOAL):", MARGIN_LEFT + 4, y + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(meeting.goal || "Penyelarasan tim, pelacakan deviasi progres proyek, dan penanganan hambatan.", MARGIN_LEFT + 4, y + 11, { maxWidth: CONTENT_WIDTH - 8 });

  y += 26;

  // 4. Meeting Agenda Section
  checkPageOverflow(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("I. RENCANA AGENDA AWAL", MARGIN_LEFT, y);
  
  y += 1.5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  
  y += 5;

  const agendaLines = meeting.agenda.split("\n").filter(line => line.trim().length > 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // slate-700

  agendaLines.forEach((line) => {
    const wrappedText = doc.splitTextToSize(line, CONTENT_WIDTH - 6);
    const blockHeight = wrappedText.length * 5 + 1;
    checkPageOverflow(blockHeight);
    
    doc.text("•", MARGIN_LEFT + 1, y);
    doc.text(wrappedText, MARGIN_LEFT + 5, y);
    y += blockHeight;
  });

  y += 6;

  // 5. Participants Section
  checkPageOverflow(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("II. DAFTAR HADIR & PESERTA RAPAT", MARGIN_LEFT, y);
  
  y += 1.5;
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("NAMA PESERTA & JABATAN / DEPARTEMEN", MARGIN_LEFT, y);
  doc.text("STATUS", MARGIN_LEFT + 120, y);
  doc.text("JENIS HADIR", MARGIN_LEFT + 145, y);

  y += 3;
  doc.setDrawColor(241, 245, 249);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 4;

  const resolvedParticipants = meeting.participantIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
  
  // Make sure at least host & notulis are shown if resolved list is empty
  if (resolvedParticipants.length === 0) {
    if (hostUser) resolvedParticipants.push(hostUser);
    if (notulisUser && notulisUser.id !== meeting.hostId) resolvedParticipants.push(notulisUser);
  }

  resolvedParticipants.forEach((p) => {
    checkPageOverflow(6);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(p.name, MARGIN_LEFT, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(` — ${p.role} (${p.division || p.department || "Internal"})`, MARGIN_LEFT + doc.getTextWidth(p.name), y);

    // Status label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text("HADIR", MARGIN_LEFT + 120, y);

    // Attendance type
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(p.attendanceType || (meeting.locationType === "Online" ? "Online (VIP Link)" : "Tatap Muka"), MARGIN_LEFT + 145, y);

    y += 5.5;
  });

  y += 6;

  // 6. Minutes of Meeting (MoM Content Generated by AI)
  checkPageOverflow(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("III. MINUTES OF MEETING (MoM) & RISALAH DISKUSI", MARGIN_LEFT, y);
  
  y += 1.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  
  y += 6;

  const rawMoM = meeting.momMarkdown || "Dokumen hasil risalah rapat belum diterbitkan atau disintesis oleh Asisten AI.";
  const rawLines = rawMoM.split("\n");

  rawLines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      y += 2.5; // paragraph spacing
      return;
    }

    // Determine heading levels
    if (trimmed.startsWith("## ")) {
      const txt = cleanMarkdownSymbols(trimmed.replace(/^##\s+/, ""));
      const wrapped = doc.splitTextToSize(txt, CONTENT_WIDTH);
      const h = wrapped.length * 6 + 4;
      
      checkPageOverflow(h);
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(79, 70, 229); // Indigo accent for major headings
      doc.text(wrapped, MARGIN_LEFT, y);
      y += h - 2;
      
      // Draw subline
      doc.setDrawColor(238, 242, 255); // indigo-50
      doc.setLineWidth(0.4);
      doc.line(MARGIN_LEFT, y - 1, MARGIN_LEFT + 50, y - 1);
      y += 1;
    } 
    else if (trimmed.startsWith("### ")) {
      const txt = cleanMarkdownSymbols(trimmed.replace(/^###\s+/, ""));
      const wrapped = doc.splitTextToSize(txt, CONTENT_WIDTH);
      const h = wrapped.length * 5 + 3;
      
      checkPageOverflow(h);
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(wrapped, MARGIN_LEFT, y);
      y += h - 1;
    } 
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const txt = trimmed.replace(/^[-*]\s+/, "");
      
      // Look for bold highlights like "- **Keputusan:** blabla"
      const segments = parseInlineStyles(txt);
      
      // Wrap the complete cleaned line for height computation
      const cleanedText = cleanMarkdownSymbols(txt);
      const wrappedLines = doc.splitTextToSize(cleanedText, CONTENT_WIDTH - 6);
      const h = wrappedLines.length * 4.8;
      
      checkPageOverflow(h + 1);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("•", MARGIN_LEFT + 2, y);

      // Advanced inline formatting: draw the line and handle bold vs normal segments
      let cursorX = MARGIN_LEFT + 6;
      let lineY = y;
      
      segments.forEach((seg, sIdx) => {
        if (seg.isBold) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 23, 42); // Darker color for emphasis
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
        }
        
        // We write segment, wrapping it to fit the page bounds.
        // For simple segment rendering, we write text inline. If it's a multi-line list item,
        // split text can handle it cleanly. For ultimate robustness, if it fits on one line we draw it.
        // If not, we fall back to standard wrapped plain text drawing but bold the prefix.
        if (wrappedLines.length > 1) {
          // If multi-line, fall back to plain wrapped text with styled labels
          if (sIdx === 0 && seg.isBold) {
            doc.setFont("helvetica", "bold");
            doc.text(seg.text, cursorX, lineY);
            // Move cursor
            cursorX += doc.getTextWidth(seg.text) + 1;
          } else {
            // Standard drawing for multi-line block
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);
          }
        } else {
          doc.text(seg.text, cursorX, lineY);
          cursorX += doc.getTextWidth(seg.text);
        }
      });

      // If it fell back to plain multi-line block drawing, overwrite text with standard wrap
      if (wrappedLines.length > 1) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(wrappedLines, MARGIN_LEFT + 6, y);
      }

      y += h;
    } 
    else if (/^\d+\.\s+/.test(trimmed)) {
      // Numbered items
      const txt = cleanMarkdownSymbols(trimmed.replace(/^\d+\.\s+/, ""));
      const numPrefix = trimmed.match(/^\d+\.\s+/)![0];
      const wrapped = doc.splitTextToSize(txt, CONTENT_WIDTH - 8);
      const h = wrapped.length * 4.8;
      
      checkPageOverflow(h + 1);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      doc.text(numPrefix, MARGIN_LEFT + 2, y);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(wrapped, MARGIN_LEFT + 8, y);
      
      y += h;
    } 
    else {
      // Plain Paragraphs
      const txt = cleanMarkdownSymbols(trimmed);
      const wrapped = doc.splitTextToSize(txt, CONTENT_WIDTH);
      const h = wrapped.length * 4.8 + 1.5;
      
      checkPageOverflow(h);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(wrapped, MARGIN_LEFT, y);
      
      y += h;
    }
  });

  y += 12;

  // 7. Signature / Sign-Off Panels
  // We place sign-off tables block. Takes about 35mm height.
  checkPageOverflow(40);
  
  y += 3;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("PENGESAHAN DOKUMEN (SIGN-OFF)", MARGIN_LEFT, y);

  y += 6;

  // Column offsets for signatures
  const colA = MARGIN_LEFT + 5;
  const colB = MARGIN_LEFT + 100;

  // Signature titles
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Disetujui Oleh, / Approved By,", colA, y);
  doc.text("Disusun & Dicatat Oleh, / Recorded By,", colB, y);

  y += 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Pimpinan Rapat (Chairperson)", colA, y);
  doc.text("Notulis Rapat (Meeting Secretary)", colB, y);

  // Leave space for physical signature or draw simulation
  y += 16;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${hostUser ? hostUser.name : "..................................."} )`, colA, y);
  doc.text(`( ${notulisUser ? notulisUser.name : "..................................."} )`, colB, y);

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Jabatan: ${hostUser ? hostUser.role : "Host Rapat"}`, colA, y);
  doc.text(`Jabatan: ${notulisUser ? notulisUser.role : "Notulis"}`, colB, y);

  // ----------------------------------------------------
  // SECOND PASS: Draw Headers, Footers, Page Numbers, and Borders
  // ----------------------------------------------------
  const drawHeaderAndFooter = (pageNo: number, totalPages: number) => {
    // We do NOT draw full header on page 1 as it has the beautiful big header title
    const isFirstPage = pageNo === 1;

    // Draw page outer frame
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.25);
    doc.rect(MARGIN_LEFT - 4, 10, CONTENT_WIDTH + 8, PAGE_HEIGHT - 20, "S");

    // Header Drawing
    if (!isFirstPage) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("FOKUS GIGA INDONESIA", MARGIN_LEFT, 15);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate-500
      const brandWidth = doc.getTextWidth("FOKUS GIGA INDONESIA ") + 1;
      doc.text(` |   Risalah Rapat: ${meeting.title}`, MARGIN_LEFT + brandWidth, 15, { maxWidth: CONTENT_WIDTH - brandWidth - 20 });
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("MOM-OFFICIAL", PAGE_WIDTH - MARGIN_RIGHT, 15, { align: "right" });

      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.25);
      doc.line(MARGIN_LEFT, 17, PAGE_WIDTH - MARGIN_RIGHT, 17);
    }

    // Footer Drawing
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.25);
    doc.line(MARGIN_LEFT, PAGE_HEIGHT - 16, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Dokumen ini diterbitkan secara otomatis oleh FGi AI Assistant & terdaftar di sistem ERP perusahaan.", MARGIN_LEFT, PAGE_HEIGHT - 12);
    doc.setFont("helvetica", "bold");
    doc.text("RAHASIA / CONFIDENTIAL", MARGIN_LEFT, PAGE_HEIGHT - 8);

    doc.setFont("helvetica", "normal");
    const pageString = `Halaman ${pageNo} dari ${totalPages}`;
    doc.text(pageString, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 10, { align: "right" });
  };

  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    drawHeaderAndFooter(i, totalPagesCount);
  }

  // 8. Save/Download the PDF file
  const sanitizeFilename = (meeting.title || "Risalah_Rapat")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  
  const filename = `fgi_mom_${meeting.meetingNumber || "000"}_${sanitizeFilename}.pdf`;
  doc.save(filename);
};
