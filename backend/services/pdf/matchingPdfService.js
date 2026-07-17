// ─────────────────────────────────────────────────────────────────────────
// Kundli Matching PDF Service (V4.0 Phase 1)
//
// Renders a premium, multi-page, printable PDF for a Kundli Matching
// result. This is a NEW, separate file from services/pdf/pdfReportService.js
// — per the V4.0 brief ("Do NOT modify existing report generation... Do
// NOT modify PDF generation unless required for Kundli Matching"), the
// existing single-person report PDF is completely untouched. This file
// mirrors its visual language (palette, section-header/table/card
// conventions) so the exported document still feels native to
// NakshatraVerse, but owns its own small set of layout helpers rather than
// reaching into the other file's module-private functions.
//
// Pure presentation layer: every fact rendered is a direct read of
// personA/personB/chartA/chartB/matching/explanation — the exact objects
// the frontend already has after calling /api/matching/compute or
// /api/matching/generate-report. No astrology calculation and no Gemini
// call happens in this file.
// ─────────────────────────────────────────────────────────────────────────
import PDFDocument from "pdfkit";

const GOLD_BRIGHT = "#b8901a";
const PURPLE = "#4a1a80";
const PURPLE_DARK = "#2c0f4d";
const MUTED = "#5a5566";
const DARK = "#201830";
const ROW_ALT = "#f1eaff";
const BORDER = "#ded4f0";

const GENERATED_BY = "NakshatraVerse V4.0";

function asciiOnly(text) {
  return String(text ?? "").replace(/[^\x20-\x7E]/g, "").trim();
}

function fmt(value, fallback = "Not available.") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && !value.trim()) return fallback;
  return value;
}

function ensureSpace(doc, needed) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

function drawBullet(doc, x, y, color) {
  doc.save();
  doc.circle(x, y, 4).fill(color);
  doc.circle(x, y, 4).lineWidth(0.75).strokeColor("#ffffff").stroke();
  doc.restore();
}

function sectionHeader(doc, title, { color = PURPLE } = {}) {
  ensureSpace(doc, 46);
  doc.moveDown(0.7);
  const y = doc.y + 7;
  drawBullet(doc, doc.page.margins.left + 4, y, color);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(15).text(title, doc.page.margins.left + 16, doc.y);
  doc.moveTo(doc.page.margins.left, doc.y + 4)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
    .strokeColor(BORDER).lineWidth(1).stroke();
  doc.moveDown(0.7);
  doc.fillColor(DARK).font("Helvetica").fontSize(10.5);
}

function paragraph(doc, text, { fallback = "Not available." } = {}) {
  ensureSpace(doc, 18);
  doc.fillColor(DARK).font("Helvetica").fontSize(10.5).text(fmt(text, fallback));
  doc.moveDown(0.5);
}

function keyValueRow(doc, label, value) {
  ensureSpace(doc, 16);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text(`${label}:  `, { continued: true });
  doc.font("Helvetica").fillColor(DARK).text(String(value ?? "\u2014"));
}

function drawTable(doc, { headers, rows, weights, accent = PURPLE }) {
  if (!rows || rows.length === 0) {
    paragraph(doc, null, { fallback: "No data available." });
    return;
  }
  const left = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map((w) => (w / totalWeight) * usableWidth);
  const rowHeight = 20;
  const headerHeight = 22;

  const drawHeaderRow = () => {
    ensureSpace(doc, headerHeight + rowHeight);
    let x = left;
    const y = doc.y;
    doc.rect(left, y, usableWidth, headerHeight).fill(accent);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9.5);
    headers.forEach((h, i) => {
      doc.text(h, x + 6, y + 6, { width: colWidths[i] - 10, ellipsis: true });
      x += colWidths[i];
    });
    doc.y = y + headerHeight;
  };

  drawHeaderRow();
  rows.forEach((row, idx) => {
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeaderRow();
    }
    let x = left;
    const y = doc.y;
    if (idx % 2 === 1) doc.rect(left, y, usableWidth, rowHeight).fill(ROW_ALT);
    doc.fillColor(DARK).font("Helvetica").fontSize(9.5);
    row.forEach((cell, i) => {
      doc.text(String(cell ?? "\u2014"), x + 6, y + 5, { width: colWidths[i] - 10, ellipsis: true });
      x += colWidths[i];
    });
    doc.rect(left, y, usableWidth, rowHeight).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.y = y + rowHeight;
  });
  doc.moveDown(0.6);
}

function drawCoverPage(doc, { personA, personB, matching, generatedDate }) {
  const { width, height } = doc.page;
  doc.rect(0, 0, width, height).fill(PURPLE_DARK);
  doc.rect(0, 0, width, 8).fill(GOLD_BRIGHT);
  doc.rect(0, height - 8, width, 8).fill(GOLD_BRIGHT);

  doc.save();
  doc.strokeOpacity(0.5);
  doc.circle(width / 2, 168, 70).lineWidth(1.4).strokeColor(GOLD_BRIGHT).stroke();
  doc.strokeOpacity(0.3);
  doc.circle(width / 2, 168, 84).lineWidth(0.8).strokeColor(GOLD_BRIGHT).stroke();
  doc.restore();

  doc.fillColor("#ffd700").font("Helvetica-Bold").fontSize(13).text("N A K S H A T R A V E R S E", 0, 148, { align: "center" });
  doc.fillColor("#f5efff").font("Helvetica-Oblique").fontSize(11).text("Vedic Kundli Matching Report", { align: "center" });

  doc.moveDown(3);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text(
    `${asciiOnly(personA?.name) || "Person A"}  &  ${asciiOnly(personB?.name) || "Person B"}`,
    { align: "center" }
  );

  doc.moveDown(1);
  doc.fillColor("#ffd700").font("Helvetica-Bold").fontSize(15).text(
    `${matching.totalScore} / ${matching.maxScore} Gunas  (${matching.percentage}%)`,
    { align: "center" }
  );
  doc.fillColor("#d9c7ff").font("Helvetica-Bold").fontSize(12).text(matching.compatibility.label, { align: "center" });

  const cardW = 320, cardX = (width - cardW) / 2, cardY = height - 175;
  doc.save();
  doc.fillOpacity(0.06);
  doc.roundedRect(cardX, cardY, cardW, 92, 8).fill("#ffffff");
  doc.restore();
  doc.save();
  doc.strokeOpacity(0.4);
  doc.roundedRect(cardX, cardY, cardW, 92, 8).lineWidth(1).strokeColor(GOLD_BRIGHT).stroke();
  doc.restore();
  doc.font("Helvetica").fontSize(9.5).fillColor("#e8d5ff");
  doc.text(`Generated Date:  ${generatedDate}`, cardX + 18, cardY + 16);
  doc.text(`Report Version:  V4.0`, cardX + 18, cardY + 36);
  doc.text(`Generated By:  ${GENERATED_BY}`, cardX + 18, cardY + 56);
  doc.text(`Format:  High-Resolution Vector PDF`, cardX + 18, cardY + 76);
}

export function buildMatchingPdfBuffer({ personA = {}, personB = {}, chartA = {}, chartB = {}, matching = {}, explanation = null, title }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
        info: {
          Title: title || `${personA.name || "Person A"} & ${personB.name || "Person B"} — Kundli Matching Report`,
          Author: GENERATED_BY,
          Subject: "Vedic Kundli Matching (Ashtakoota) Report",
          Creator: GENERATED_BY,
        },
      });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const generatedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      // 1. Cover page
      drawCoverPage(doc, { personA, personB, matching, generatedDate });

      // 2. Birth details for both people
      doc.addPage();
      sectionHeader(doc, "Birth Details");
      drawTable(doc, {
        headers: ["", "Person A", "Person B"],
        rows: [
          ["Name", asciiOnly(personA.name), asciiOnly(personB.name)],
          ["Gender", personA.gender, personB.gender],
          ["Date of Birth", personA.dob, personB.dob],
          ["Time of Birth", personA.tob, personB.tob],
          ["Place of Birth", asciiOnly(personA.pob), asciiOnly(personB.pob)],
          ["Moon Sign", chartA.moonSign, chartB.moonSign],
          ["Nakshatra", `${chartA.nakshatra?.name || "\u2014"} (Pada ${chartA.nakshatra?.pada ?? "\u2014"})`, `${chartB.nakshatra?.name || "\u2014"} (Pada ${chartB.nakshatra?.pada ?? "\u2014"})`],
          ["Lagna", chartA.lagna, chartB.lagna],
        ],
        weights: [1.4, 2, 2],
      });

      // 3. Ashtakoota / Guna Milan scores
      sectionHeader(doc, "Ashtakoota (Guna Milan) Scores");
      const kootas = Object.values(matching.ashtakoota || {});
      drawTable(doc, {
        headers: ["Koota", "Score", "Max"],
        rows: kootas.map((k) => [k.name, k.score, k.max]),
        weights: [2.2, 1, 1],
      });
      doc.font("Helvetica-Bold").fontSize(12).fillColor(PURPLE_DARK).text(
        `Total: ${matching.totalScore} / ${matching.maxScore}  (${matching.percentage}%)  \u2014  ${matching.compatibility?.label}`
      );
      doc.moveDown(0.5);
      kootas.forEach((k) => {
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(PURPLE_DARK).text(`${k.name} (${k.score}/${k.max})`);
        paragraph(doc, k.detail);
      });

      // 4. Manglik Analysis
      sectionHeader(doc, "Manglik (Kuja Dosha) Analysis");
      keyValueRow(doc, `${personA.name || "Person A"}`, matching.manglik?.personA?.isManglik ? `Manglik (${matching.manglik.personA.severity})` : "Not Manglik");
      paragraph(doc, matching.manglik?.personA?.detail);
      keyValueRow(doc, `${personB.name || "Person B"}`, matching.manglik?.personB?.isManglik ? `Manglik (${matching.manglik.personB.severity})` : "Not Manglik");
      paragraph(doc, matching.manglik?.personB?.detail);
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(matching.manglik?.compatibility?.compatible ? "#2e7d32" : "#a13a3a")
        .text(matching.manglik?.compatibility?.compatible ? "Manglik Compatible" : "Manglik Not Compatible");
      paragraph(doc, matching.manglik?.compatibility?.detail);

      // 5. Dosha comparison
      sectionHeader(doc, "Major Dosha Comparison");
      const doshaRows = [];
      const dA = matching.doshaComparison?.personA || [];
      const dB = matching.doshaComparison?.personB || [];
      const maxLen = Math.max(dA.length, dB.length, 1);
      for (let i = 0; i < maxLen; i++) {
        doshaRows.push([dA[i]?.name || "\u2014", dB[i]?.name || "\u2014"]);
      }
      drawTable(doc, { headers: [personA.name || "Person A", personB.name || "Person B"], rows: doshaRows, weights: [1, 1] });

      // 6. Strong / Weak planet comparison
      sectionHeader(doc, "Strong / Weak Planet Comparison");
      drawTable(doc, {
        headers: ["", "Strongest Planet", "Weakest Planet"],
        rows: [
          [personA.name || "Person A", matching.planetStrength?.personA?.strongest?.planet, matching.planetStrength?.personA?.weakest?.planet],
          [personB.name || "Person B", matching.planetStrength?.personB?.strongest?.planet, matching.planetStrength?.personB?.weakest?.planet],
        ],
        weights: [1.4, 2, 2],
      });

      // 7. AI Explanation (only if a matching/generate-report explanation was provided)
      if (explanation) {
        sectionHeader(doc, "AI Compatibility Explanation");
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(PURPLE_DARK).text("Compatibility Summary");
        paragraph(doc, explanation.compatibilitySummary);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(PURPLE_DARK).text("Strengths");
        paragraph(doc, explanation.strengths);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(PURPLE_DARK).text("Weaknesses");
        paragraph(doc, explanation.weaknesses);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(PURPLE_DARK).text("Marriage Advice");
        paragraph(doc, explanation.marriageAdvice);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(PURPLE_DARK).text("Practical Guidance");
        paragraph(doc, explanation.practicalGuidance);
      }

      // Footer page numbers
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(
          `NakshatraVerse \u2014 Kundli Matching \u2014 Page ${i + 1} of ${range.count}`,
          doc.page.margins.left,
          doc.page.height - doc.page.margins.bottom + 18,
          { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: "center" }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default { buildMatchingPdfBuffer };
