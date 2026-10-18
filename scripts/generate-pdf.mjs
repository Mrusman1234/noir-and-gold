import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const ROOT_DIR = process.cwd();
const DOCS_DIR = path.join(ROOT_DIR, "docs");
const OUTPUT_PDF = path.join(ROOT_DIR, "NOIR_AND_GOLD_COMPLETE_TECHNICAL_DOCUMENTATION.pdf");

const DOC_FILES = [
  { file: "01_PROJECT_OVERVIEW.md", title: "1. Project Overview & Executive Summary" },
  { file: "02_TECHNOLOGY_STACK.md", title: "2. Technology Stack & Tooling Guide" },
  { file: "03_FOLDER_AND_FILE_STRUCTURE.md", title: "3. Repository Architecture & File Map" },
  { file: "04_FRONTEND_ARCHITECTURE.md", title: "4. Frontend Architecture & App Router Deep-Dive" },
  { file: "05_BACKEND_ARCHITECTURE.md", title: "5. Backend Architecture & Express REST API" },
  { file: "06_API_REFERENCE.md", title: "6. Complete API Reference" },
  { file: "07_DATABASE_AND_DATA_MODEL.md", title: "7. Database Design & Prisma ORM Deep-Dive" },
  { file: "08_AUTHENTICATION_AND_SECURITY.md", title: "8. Authentication, Authorization & Security Architecture" },
  { file: "09_ECOMMERCE_WORKFLOWS.md", title: "9. E-Commerce Business Workflows & State Machines" },
  { file: "10_ENVIRONMENT_SETUP_AND_COMMANDS.md", title: "10. Developer Environment Setup & CLI Reference" },
  { file: "11_TESTING_AND_QUALITY_ASSURANCE.md", title: "11. Testing Strategy & Test Suite Guide" },
  { file: "12_DEPLOYMENT_AND_PRODUCTION_READINESS.md", title: "12. Production Deployment & Operations Guide" },
  { file: "13_COMPLETE_LEARNING_ROADMAP.md", title: "13. Full-Stack Engineer Learning Roadmap" },
  { file: "14_GLOSSARY_AND_INTERVIEW_PREPARATION.md", title: "14. Technical Glossary & Senior Interview Guide" },
];

const COLORS = {
  noir: "#0D0D0D",
  gold: "#C9A84C",
  darkGold: "#9E7D2B",
  charcoal: "#1F2022",
  textPrimary: "#1A1A1A",
  textSecondary: "#4A4A4A",
  codeBg: "#18181B",
  codeText: "#E4E4E7",
  codeBorder: "#3F3F46",
  tableHeaderBg: "#121214",
  tableHeaderText: "#E8C872",
  tableRowEven: "#F8F8FA",
  tableRowOdd: "#FFFFFF",
  tableBorder: "#D4D4D8",
  calloutBg: "#FAF8F4",
  calloutBorder: "#E8DFD0",
  calloutAccent: "#C9A84C",
};

// Page Dimensions (A4)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 45;
const MARGIN_RIGHT = 45;
const MARGIN_TOP = 48;
const MARGIN_BOTTOM = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
  bufferPages: true,
  autoFirstPage: false,
});

const writeStream = fs.createWriteStream(OUTPUT_PDF);
doc.pipe(writeStream);

// Helper: Ensure doc.x is reset to standard margin
function resetX() {
  doc.x = MARGIN_LEFT;
}

// Helper: Check space and add page if needed
function ensureSpace(neededHeight) {
  if (doc.y + neededHeight > PAGE_HEIGHT - MARGIN_BOTTOM - 10) {
    doc.addPage();
    doc.y = MARGIN_TOP + 10;
    resetX();
    return true;
  }
  resetX();
  return false;
}

// Strip markdown formatting for text rendering
function cleanMarkdown(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\\([#*_`~[\]()$<>-])/g, "$1");
}

// ==========================================
// 1. COVER PAGE (Page 1)
// ==========================================
doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });

// Full background luxury noir
doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(COLORS.noir);

// Geometric Gold Borders
doc.rect(26, 26, PAGE_WIDTH - 52, PAGE_HEIGHT - 52).lineWidth(1.5).stroke(COLORS.gold);
doc.rect(32, 32, PAGE_WIDTH - 64, PAGE_HEIGHT - 64).lineWidth(0.5).stroke(COLORS.darkGold);

// Header Emblem Text
doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(10).text("HAUTE COUTURE DIGITAL ATELIER & APPAREL PLATFORM", 45, 130, {
  align: "center",
  characterSpacing: 2,
});

// Title
doc.moveDown(1.5);
doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(34).text("NOIR & GOLD", {
  align: "center",
  characterSpacing: 3,
});

// Accent line
const lineY = doc.y + 12;
doc.moveTo((PAGE_WIDTH - 140) / 2, lineY).lineTo((PAGE_WIDTH + 140) / 2, lineY).lineWidth(2).stroke(COLORS.gold);

// Subtitle
doc.y = lineY + 22;
doc.fillColor(COLORS.gold).font("Helvetica").fontSize(14.5).text("Complete Technical Documentation & Engineering Handbook", {
  align: "center",
});

doc.moveDown(0.7);
doc.fillColor("#B0B0B0").font("Helvetica").fontSize(10.5).text("System Architecture, Full-Stack Design, API Reference, Database Modeling, Security, and Learning Roadmap", {
  align: "center",
  width: CONTENT_WIDTH,
});

// Middle Specifications Card
const cardTop = 370;
const cardWidth = 430;
const cardX = (PAGE_WIDTH - cardWidth) / 2;
doc.rect(cardX, cardTop, cardWidth, 230).fillAndStroke("#141416", COLORS.darkGold);

doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(12).text("ENGINEERING SPECIFICATIONS & AUDIT SUMMARY", cardX + 22, cardTop + 22, {
  align: "left",
  characterSpacing: 1,
});

const specs = [
  ["Platform Architecture", "Next.js 16 (App Router) + Express 4 Monorepo"],
  ["Frontend & UI Engine", "React 19.3.0 + Tailwind CSS v4 + Turbopack"],
  ["Database & Persistence", "SQLite 3 + Prisma ORM 5.22 (14 Relational Models)"],
  ["Security & Governance", "HMAC-SHA256 Webhooks, RBAC, Dual Rate Limiters"],
  ["Testing & Quality Gates", "122 Passing Automated Integration Tests (100% Green)"],
  ["Code Quality Status", "0 ESLint Errors/Warnings, Strict TypeScript Typecheck"],
  ["Technical Documentation", "14 Comprehensive Educational Modules in docs/"],
];

let specY = cardTop + 54;
for (const [k, v] of specs) {
  doc.fillColor("#A0A0A5").font("Helvetica").fontSize(9).text(k, cardX + 22, specY);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9).text(v, cardX + 175, specY);
  specY += 22;
}

// Cover Footer
doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(9.5).text("AUTHOR & SYSTEMS ARCHITECT", 45, PAGE_HEIGHT - 110, { align: "center" });
doc.fillColor("#E0E0E0").font("Helvetica").fontSize(8.5).text("Principal Full-Stack Engineer & Application Security Auditor", 45, PAGE_HEIGHT - 96, { align: "center" });
doc.fillColor("#888888").font("Helvetica").fontSize(8).text(`Publication Date: October 2026  |  Document Ref: NG-ARCH-2026-FINAL  |  Enterprise Edition`, 45, PAGE_HEIGHT - 78, { align: "center" });

// ==========================================
// 2. TABLE OF CONTENTS PAGE (Page 2)
// ==========================================
doc.addPage({ margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT } });
const tocPageIndex = 1; // 0-indexed page 2

// ==========================================
// 3. CHAPTER RENDERING (Pages 3+)
// ==========================================
const chapterStartPages = [];

for (let i = 0; i < DOC_FILES.length; i++) {
  const { file, title } = DOC_FILES[i];
  const filePath = path.join(DOCS_DIR, file);

  if (!fs.existsSync(filePath)) continue;

  // New page for each chapter
  doc.addPage({ margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT } });
  const currentPageNum = doc.bufferedPageRange().count;
  chapterStartPages.push({ fileIndex: i, pageNum: currentPageNum });

  resetX();
  doc.y = MARGIN_TOP;

  // Render Chapter Header Banner
  doc.rect(MARGIN_LEFT, doc.y, CONTENT_WIDTH, 32).fill(COLORS.noir);
  doc.fillColor(COLORS.tableHeaderText).font("Helvetica-Bold").fontSize(11).text(title.toUpperCase(), MARGIN_LEFT + 14, doc.y + 10, {
    width: CONTENT_WIDTH - 28,
  });

  doc.y = MARGIN_TOP + 46;
  resetX();

  const rawContent = fs.readFileSync(filePath, "utf8");
  const lines = rawContent.split(/\r?\n/);

  let inCodeBlock = false;
  let codeBuffer = [];
  let inTable = false;
  let tableRows = [];

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];

    // Horizontal Rule
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      if (inTable) {
        inTable = false;
        renderTable(tableRows);
        tableRows = [];
      }
      ensureSpace(18);
      const ruleY = doc.y + 6;
      doc.moveTo(MARGIN_LEFT, ruleY).lineTo(MARGIN_LEFT + CONTENT_WIDTH, ruleY).lineWidth(0.75).stroke(COLORS.gold);
      doc.y = ruleY + 12;
      resetX();
      continue;
    }

    // Code Block
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        renderCodeBox(codeBuffer.join("\n"));
        codeBuffer = [];
      } else {
        if (inTable) {
          inTable = false;
          renderTable(tableRows);
          tableRows = [];
        }
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Table Rows
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      if (line.includes("---")) {
        continue; // delimiter row
      }
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      inTable = false;
      renderTable(tableRows);
      tableRows = [];
    }

    // Headings
    if (line.startsWith("# ")) {
      // Main H1 - banner already rendered, skip
      continue;
    } else if (line.startsWith("## ")) {
      ensureSpace(48);
      resetX();
      doc.moveDown(0.8);
      const headingText = cleanMarkdown(line.replace("## ", "").trim());
      doc.fillColor(COLORS.noir).font("Helvetica-Bold").fontSize(13.5).text(headingText, MARGIN_LEFT, doc.y);
      const barY = doc.y + 2;
      doc.moveTo(MARGIN_LEFT, barY).lineTo(MARGIN_LEFT + 140, barY).lineWidth(1.5).stroke(COLORS.gold);
      doc.y = barY + 8;
      resetX();
      continue;
    } else if (line.startsWith("### ")) {
      ensureSpace(32);
      resetX();
      doc.moveDown(0.6);
      const subText = cleanMarkdown(line.replace("### ", "").trim());
      doc.fillColor(COLORS.charcoal).font("Helvetica-Bold").fontSize(10.5).text(subText, MARGIN_LEFT, doc.y);
      doc.moveDown(0.3);
      resetX();
      continue;
    } else if (line.startsWith("#### ")) {
      ensureSpace(24);
      resetX();
      doc.moveDown(0.4);
      const subSubText = cleanMarkdown(line.replace("#### ", "").trim());
      doc.fillColor(COLORS.darkGold).font("Helvetica-Bold").fontSize(9.5).text(subSubText, MARGIN_LEFT, doc.y);
      doc.moveDown(0.2);
      resetX();
      continue;
    }

    // Blockquote / Callout
    if (line.startsWith("> ")) {
      ensureSpace(42);
      resetX();
      const quoteText = cleanMarkdown(line.replace(/^>\s*/, ""));
      const boxY = doc.y;
      doc.rect(MARGIN_LEFT, boxY, CONTENT_WIDTH, 30).fillAndStroke(COLORS.calloutBg, COLORS.calloutBorder);
      doc.rect(MARGIN_LEFT, boxY, 4, 30).fill(COLORS.calloutAccent);
      doc.fillColor(COLORS.textPrimary).font("Helvetica-Oblique").fontSize(8.5).text(quoteText, MARGIN_LEFT + 14, boxY + 8, {
        width: CONTENT_WIDTH - 24,
      });
      doc.y = boxY + 36;
      resetX();
      continue;
    }

    // Unordered List item
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      ensureSpace(18);
      resetX();
      const bulletText = cleanMarkdown(line.trim().replace(/^[-*]\s*/, ""));
      const curY = doc.y;
      doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(9).text("•", MARGIN_LEFT + 4, curY);
      doc.fillColor(COLORS.textPrimary).font("Helvetica").fontSize(8.5).text(bulletText, MARGIN_LEFT + 16, curY, {
        width: CONTENT_WIDTH - 20,
        lineGap: 1.5,
      });
      doc.moveDown(0.25);
      resetX();
      continue;
    }

    // Ordered List item
    if (/^\d+\.\s/.test(line.trim())) {
      ensureSpace(18);
      resetX();
      const match = line.trim().match(/^(\d+\.)\s*(.*)$/);
      if (match) {
        const curY = doc.y;
        doc.fillColor(COLORS.darkGold).font("Helvetica-Bold").fontSize(8.5).text(match[1], MARGIN_LEFT + 2, curY);
        doc.fillColor(COLORS.textPrimary).font("Helvetica").fontSize(8.5).text(cleanMarkdown(match[2]), MARGIN_LEFT + 18, curY, {
          width: CONTENT_WIDTH - 22,
          lineGap: 1.5,
        });
        doc.moveDown(0.25);
        resetX();
      }
      continue;
    }

    // Normal Paragraph
    if (line.trim().length > 0) {
      ensureSpace(20);
      resetX();
      doc.fillColor(COLORS.textPrimary).font("Helvetica").fontSize(8.5).text(cleanMarkdown(line), MARGIN_LEFT, doc.y, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });
      doc.moveDown(0.45);
      resetX();
    }
  }

  if (inTable && tableRows.length > 0) {
    renderTable(tableRows);
    tableRows = [];
  }
}

// Render Code Box with Line Wrapping and Syntax Box
function renderCodeBox(code) {
  const lines = code.split("\n");
  const lineHeight = 10;
  const padding = 8;
  const maxLines = Math.min(lines.length, 35);
  const boxHeight = maxLines * lineHeight + padding * 2;

  ensureSpace(boxHeight + 10);
  resetX();

  const startY = doc.y;
  doc.rect(MARGIN_LEFT, startY, CONTENT_WIDTH, boxHeight).fillAndStroke(COLORS.codeBg, COLORS.codeBorder);
  doc.rect(MARGIN_LEFT, startY, 3, boxHeight).fill(COLORS.gold);

  doc.fillColor(COLORS.codeText).font("Courier").fontSize(7.5);

  let curY = startY + padding;
  for (let i = 0; i < maxLines; i++) {
    const rawLine = lines[i];
    const displayLine = i === maxLines - 1 && lines.length > maxLines
      ? "... [remaining code truncated for layout brevity]"
      : rawLine.substring(0, 95);

    doc.text(displayLine, MARGIN_LEFT + 10, curY, {
      width: CONTENT_WIDTH - 20,
      lineBreak: false,
    });
    curY += lineHeight;
  }

  doc.y = startY + boxHeight + 10;
  resetX();
}

// Render Table with Intelligent Column Widths & Auto-Wrap
function renderTable(rows) {
  if (rows.length === 0) return;

  const colCount = rows[0].length;

  // Determine column widths
  let colWidths = [];
  if (colCount === 2) {
    colWidths = [150, CONTENT_WIDTH - 150];
  } else if (colCount === 3) {
    colWidths = [120, 140, CONTENT_WIDTH - 260];
  } else if (colCount === 4) {
    colWidths = [95, 80, 130, CONTENT_WIDTH - 305];
  } else {
    const w = CONTENT_WIDTH / colCount;
    colWidths = Array(colCount).fill(w);
  }

  for (let r = 0; r < rows.length; r++) {
    const isHeader = r === 0;
    const rowData = rows[r];

    // Measure max height needed for this row
    let maxCellHeight = 16;
    doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(7.5);

    for (let c = 0; c < colCount; c++) {
      const text = cleanMarkdown(rowData[c] || "");
      const w = colWidths[c] - 8;
      const h = doc.heightOfString(text, { width: w });
      if (h > maxCellHeight) maxCellHeight = h;
    }

    const rowHeight = maxCellHeight + 8;

    // Check space; if adding page, reprint header
    if (ensureSpace(rowHeight + 5)) {
      if (!isHeader) {
        // Redraw header row on top of new page
        renderTableRow(rows[0], colWidths, true, 22);
      }
    }

    renderTableRow(rowData, colWidths, isHeader, rowHeight, r % 2 === 0);
  }

  doc.y += 8;
  resetX();
}

function renderTableRow(cells, colWidths, isHeader, rowHeight, isEven = false) {
  resetX();
  const curY = doc.y;

  const bgColor = isHeader ? COLORS.tableHeaderBg : isEven ? COLORS.tableRowEven : COLORS.tableRowOdd;
  const textColor = isHeader ? COLORS.tableHeaderText : COLORS.textPrimary;
  const fontName = isHeader ? "Helvetica-Bold" : "Helvetica";

  // Background and borders
  doc.rect(MARGIN_LEFT, curY, CONTENT_WIDTH, rowHeight).fillAndStroke(bgColor, COLORS.tableBorder);

  // Cell text
  let cellX = MARGIN_LEFT;
  for (let c = 0; c < colWidths.length; c++) {
    const text = cleanMarkdown(cells[c] || "");
    const w = colWidths[c];

    doc.fillColor(textColor).font(fontName).fontSize(7.5).text(text, cellX + 4, curY + 4, {
      width: w - 8,
      lineGap: 1,
    });

    cellX += w;
  }

  doc.y = curY + rowHeight;
  resetX();
}

// ==========================================
// 4. RENDER TABLE OF CONTENTS ON PAGE 2
// ==========================================
doc.switchToPage(tocPageIndex);
resetX();
doc.y = MARGIN_TOP;

doc.fillColor(COLORS.noir).font("Helvetica-Bold").fontSize(20).text("TABLE OF CONTENTS");
const tocBarY = doc.y + 4;
doc.moveTo(MARGIN_LEFT, tocBarY).lineTo(PAGE_WIDTH - MARGIN_RIGHT, tocBarY).lineWidth(2).stroke(COLORS.gold);

doc.y = tocBarY + 16;
doc.fillColor(COLORS.textSecondary).font("Helvetica").fontSize(9).text(
  "This engineering handbook compiles 14 exhaustive technical modules, architectural diagrams, data models, and API specifications for the NOIR & GOLD luxury e-commerce platform.",
  { width: CONTENT_WIDTH, lineGap: 2 }
);
doc.moveDown(1.2);

for (let i = 0; i < DOC_FILES.length; i++) {
  const item = DOC_FILES[i];
  const chPage = chapterStartPages.find((p) => p.fileIndex === i);
  const targetPageNum = chPage ? chPage.pageNum : i + 3;

  const itemY = doc.y;

  // Title
  doc.fillColor(COLORS.noir).font("Helvetica-Bold").fontSize(9.5).text(item.title, MARGIN_LEFT, itemY, {
    width: CONTENT_WIDTH - 60,
    lineBreak: false,
  });

  // Page number
  const pageStr = `p. ${targetPageNum}`;
  doc.fillColor(COLORS.darkGold).font("Helvetica-Bold").fontSize(9.5).text(pageStr, PAGE_WIDTH - MARGIN_RIGHT - 45, itemY, {
    align: "right",
    lineBreak: false,
  });

  doc.y = itemY + 22;
  resetX();
}

// ==========================================
// 5. RUNNING HEADERS & FOOTERS (Pass 2)
// ==========================================
const totalPages = doc.bufferedPageRange().count;

for (let i = 1; i < totalPages; i++) {
  doc.switchToPage(i);

  // Crucial: Set bottom margin to 0 during header/footer drawing so NO blank pages are created!
  const originalBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  // Running Header
  doc.rect(MARGIN_LEFT, 26, CONTENT_WIDTH, 0.5).fill(COLORS.darkGold);
  doc.fillColor(COLORS.textSecondary).font("Helvetica").fontSize(7.5).text(
    "NOIR & GOLD  |  Complete Technical Documentation",
    MARGIN_LEFT,
    16,
    { lineBreak: false }
  );
  doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(7.5).text(
    "ENGINEERING HANDBOOK",
    PAGE_WIDTH - MARGIN_RIGHT - 140,
    16,
    { align: "right", lineBreak: false }
  );

  // Running Footer
  doc.rect(MARGIN_LEFT, PAGE_HEIGHT - 32, CONTENT_WIDTH, 0.5).fill(COLORS.tableBorder);
  doc.fillColor(COLORS.textSecondary).font("Helvetica").fontSize(7.5).text(
    "CONFIDENTIAL & PROPRIETARY  —  NOIR & GOLD DIGITAL ATELIER",
    MARGIN_LEFT,
    PAGE_HEIGHT - 24,
    { lineBreak: false }
  );
  doc.fillColor(COLORS.noir).font("Helvetica-Bold").fontSize(8).text(
    `Page ${i + 1} of ${totalPages}`,
    PAGE_WIDTH - MARGIN_RIGHT - 100,
    PAGE_HEIGHT - 24,
    { align: "right", lineBreak: false }
  );

  // Restore margin
  doc.page.margins.bottom = originalBottomMargin;
}

doc.end();

writeStream.on("finish", () => {
  const stats = fs.statSync(OUTPUT_PDF);
  console.log(`[SUCCESS] Master PDF synthesized cleanly: ${OUTPUT_PDF}`);
  console.log(`[STATS] Total pages: ${totalPages}, File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
});
