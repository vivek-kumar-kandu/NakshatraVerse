// ─────────────────────────────────────────────────────────────────────────
// PDF Report Service (V3.0 Phase 6 — Professional PDF Reports)
//
// Renders a premium, multi-page, printable PDF from data the backend has
// ALREADY computed elsewhere. This remains a pure presentation layer:
//   • No astrology calculation happens in this file.
//   • No Gemini/AI call happens in this file.
//   • Every fact rendered is a direct read of userData / chart / report —
//     the exact same objects the frontend already displays (see
//     reports.controller.js for where these come from: the full
//     /api/generate-report response for ad hoc export, or a previously
//     saved report record for saved-report export).
//
// The one exception is Planet Strength: the existing Planet Strength
// Engine (services/astrology/planetStrengthEngine.js) has never been wired
// into the public API response (see that file's header — its result is
// deliberately not merged into buildChartJson's output so /api/chart and
// /api/generate-report stay byte-identical). Phase 6 needs that data for
// the "Planet Strength" report section, so this file calls the existing,
// unmodified engine function directly — reusing it, not recalculating or
// duplicating its logic, and not changing any API response shape.
// ─────────────────────────────────────────────────────────────────────────
import PDFDocument from "pdfkit";
import { calcPlanetStrength } from "../astrology/planetStrengthEngine.js";
import logger from "../utils/logger.js";

// ── Brand palette ───────────────────────────────────────────────────────
const GOLD = "#8a6d00";
const GOLD_BRIGHT = "#b8901a";
const PURPLE = "#4a1a80";
const PURPLE_DARK = "#2c0f4d";
const MUTED = "#5a5566";
const DARK = "#201830";
const LIGHT_BG = "#f7f3ff";
const ROW_ALT = "#f1eaff";
const BORDER = "#ded4f0";
const GOOD = "#2e7d32";
const WARN = "#a15b00";

const REPORT_VERSION = "V3.0";
const GENERATED_BY = "NakshatraVerse V3.0";

// PDFKit's standard 14 fonts (Helvetica et al.) only support the WinAnsi
// glyph set. Planet keys in the data model (e.g. "Sun ☀️", "Mars ♂") carry
// decorative Unicode/emoji glyphs used for on-screen badges; those glyphs
// don't exist in Helvetica and render as mojibake/tofu in the PDF. Strip
// anything outside printable ASCII before it hits the page.
function asciiOnly(text) {
  return String(text ?? "").replace(/[^\x20-\x7E]/g, "").trim();
}

function fmt(value, fallback = "Not available.") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && !value.trim()) return fallback;
  return value;
}

function titleCase(key) {
  return String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────
// Low-level layout helpers
// ─────────────────────────────────────────────────────────────────────────

function ensureSpace(doc, needed) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

// Small vector "icon" bullet drawn next to a section heading — avoids
// relying on emoji glyphs (see asciiOnly note above) while still giving
// each section a distinct visual marker, per the Phase 6 "icons" brief.
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
  doc.fillColor(color)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(title, doc.page.margins.left + 16, doc.y, { continued: false });
  doc.moveTo(doc.page.margins.left, doc.y + 4)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
    .strokeColor(BORDER)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.7);
  doc.fillColor(DARK).font("Helvetica").fontSize(10.5);
}

function subheading(doc, text, { color = PURPLE_DARK } = {}) {
  ensureSpace(doc, 20);
  doc.font("Helvetica-Bold").fontSize(11.5).fillColor(color).text(text);
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(10.5).fillColor(DARK);
}

function paragraph(doc, text, { fallback = "Not available." } = {}) {
  ensureSpace(doc, 18);
  doc.fillColor(DARK).font("Helvetica").fontSize(10.5).text(fmt(text, fallback), { align: "left" });
  doc.moveDown(0.5);
}

function keyValueRow(doc, label, value) {
  ensureSpace(doc, 16);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text(`${label}:  `, { continued: true });
  doc.font("Helvetica").fillColor(DARK).text(String(value ?? "—"));
}

// Generic table: headers[], rows[][], relative column weights.
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
    if (idx % 2 === 1) {
      doc.rect(left, y, usableWidth, rowHeight).fill(ROW_ALT);
    }
    doc.fillColor(DARK).font("Helvetica").fontSize(9.5);
    row.forEach((cell, i) => {
      doc.text(String(cell ?? "—"), x + 6, y + 5, { width: colWidths[i] - 10, ellipsis: true });
      x += colWidths[i];
    });
    doc.rect(left, y, usableWidth, rowHeight).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.y = y + rowHeight;
  });
  doc.moveDown(0.6);
}

// Card: a rounded, left-accented block — used for Yogas / Doshas /
// Remedies / Horoscope category cards.
function drawCard(doc, { title, body, accent = GOLD_BRIGHT, tag }) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font("Helvetica-Bold").fontSize(10.5);
  const titleHeight = doc.heightOfString(title || "", { width: width - 20 });
  doc.font("Helvetica").fontSize(9.5);
  const bodyHeight = doc.heightOfString(body || "", { width: width - 20 });
  const tagHeight = tag ? 14 : 0;
  const cardHeight = 16 + titleHeight + 6 + bodyHeight + tagHeight + 10;

  ensureSpace(doc, cardHeight + 10);
  const y = doc.y;
  doc.roundedRect(left, y, width, cardHeight, 6).fill(LIGHT_BG);
  doc.roundedRect(left, y, 4, cardHeight, 2).fill(accent);
  doc.roundedRect(left, y, width, cardHeight, 6).lineWidth(0.75).strokeColor(BORDER).stroke();

  let cy = y + 10;
  if (title) {
    doc.fillColor(PURPLE_DARK).font("Helvetica-Bold").fontSize(10.5).text(title, left + 16, cy, { width: width - 30 });
    cy = doc.y + 4;
  }
  if (body) {
    doc.fillColor(DARK).font("Helvetica").fontSize(9.5).text(body, left + 16, cy, { width: width - 30 });
    cy = doc.y;
  }
  if (tag) {
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(8.5).text(tag, left + 16, cy + 3);
  }
  doc.y = y + cardHeight;
  doc.moveDown(0.5);
}

// Timeline block — a dot-on-a-rail entry used for Dasha periods and
// Prediction Timeline (1yr/5yr/10yr) entries.
function drawTimelineEntry(doc, { heading, period, body, accent = PURPLE, isLast = false }) {
  const left = doc.page.margins.left;
  const railX = left + 6;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right - 24;

  doc.font("Helvetica-Bold").fontSize(10);
  const headingHeight = doc.heightOfString(heading || "", { width });
  doc.font("Helvetica").fontSize(9.5);
  const bodyHeight = body ? doc.heightOfString(body, { width }) : 0;
  const blockHeight = 6 + headingHeight + (period ? 13 : 0) + (body ? bodyHeight + 4 : 0) + 12;

  ensureSpace(doc, blockHeight + 6);
  const y = doc.y;

  doc.circle(railX, y + 6, 3.2).fill(accent);
  if (!isLast) {
    doc.moveTo(railX, y + 10).lineTo(railX, y + blockHeight + 4).strokeColor(BORDER).lineWidth(1).stroke();
  }

  let cy = y;
  doc.fillColor(PURPLE_DARK).font("Helvetica-Bold").fontSize(10).text(heading || "", railX + 14, cy, { width });
  cy = doc.y + 1;
  if (period) {
    doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(8.5).text(period, railX + 14, cy, { width });
    cy = doc.y + 2;
  }
  if (body) {
    doc.fillColor(DARK).font("Helvetica").fontSize(9.5).text(body, railX + 14, cy, { width });
    cy = doc.y;
  }
  doc.y = Math.max(y + blockHeight, cy + 6);
}

function divider(doc) {
  ensureSpace(doc, 14);
  doc.moveDown(0.3);
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor(BORDER)
    .lineWidth(0.75)
    .dash(2, { space: 2 })
    .stroke();
  doc.undash();
  doc.moveDown(0.5);
}

// ─────────────────────────────────────────────────────────────────────────
// Cover page
// ─────────────────────────────────────────────────────────────────────────
function drawCoverPage(doc, { userData, chart, generatedDate }) {
  const { width, height } = doc.page;

  // Full-bleed wash + top/bottom brand bands.
  doc.rect(0, 0, width, height).fill(PURPLE_DARK);
  doc.rect(0, 0, width, 8).fill(GOLD_BRIGHT);
  doc.rect(0, height - 8, width, 8).fill(GOLD_BRIGHT);

  // Decorative ring motif.
  doc.save();
  doc.strokeOpacity(0.5);
  doc.circle(width / 2, 168, 70).lineWidth(1.4).strokeColor(GOLD_BRIGHT).stroke();
  doc.strokeOpacity(0.3);
  doc.circle(width / 2, 168, 84).lineWidth(0.8).strokeColor(GOLD_BRIGHT).stroke();
  doc.restore();

  doc.fillColor("#ffd700").font("Helvetica-Bold").fontSize(13).text("N A K S H A T R A V E R S E", 0, 148, { align: "center" });
  doc.fillColor("#f5efff").font("Helvetica-Oblique").fontSize(11).text("Vedic Astrology & AI Life Report", { align: "center" });

  doc.moveDown(4);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(28).text(asciiOnly(userData?.name) || "Untitled", { align: "center" });
  doc.moveDown(0.3);
  doc.fillColor("#d9c7ff").font("Helvetica").fontSize(11.5).text(
    `${userData?.dob || "—"}  ·  ${userData?.tob || "—"}  ·  ${asciiOnly(userData?.pob) || "—"}`,
    { align: "center" }
  );

  doc.moveDown(1.2);
  const chips = [
    chart?.lagna && `Lagna: ${chart.lagna}`,
    chart?.moonSign && `Moon: ${chart.moonSign}`,
    chart?.sunSign && `Sun: ${chart.sunSign}`,
    chart?.nakshatra?.name && `Nakshatra: ${chart.nakshatra.name}`,
  ].filter(Boolean);
  doc.fillColor("#ffd700").font("Helvetica-Bold").fontSize(10.5).text(chips.join("     "), { align: "center" });

  doc.font("Helvetica-Bold").fontSize(14).fillColor("#ffffff");
  doc.text("Professional Astrology Report", 0, height - 210, { align: "center" });

  // Metadata card near the bottom of the cover.
  const cardW = 320;
  const cardX = (width - cardW) / 2;
  const cardY = height - 175;
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
  doc.text(`Report Version:  ${REPORT_VERSION}`, cardX + 18, cardY + 36);
  doc.text(`Generated By:  ${GENERATED_BY}`, cardX + 18, cardY + 56);
  doc.text(`Format:  High-Resolution Vector PDF`, cardX + 18, cardY + 76);
}

// ─────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────

/**
 * Builds a premium, multi-page PDF buffer from the exact backend-computed
 * data the frontend already renders:
 *   userData  — birth details
 *   chart     — computeChart() output (planetary, numerology, lagna,
 *               moonSign, sunSign, nakshatra, yogas, doshas, remedies)
 *   report    — the full /api/generate-report response (narrative fields
 *               + nakshatraProfile + predictions + predictionTimeline +
 *               dasha + transits), OR a saved-report record with the
 *               same shape.
 * Returns a Promise<Buffer>. Performs no astrology calculation of its own
 * (Planet Strength is read via the existing, unmodified engine — see file
 * header) and never calls Gemini.
 */
export function buildReportPdfBuffer({ userData = {}, chart = {}, report = {}, title }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
        info: {
          Title: title || `${userData.name || "NakshatraVerse"} — Astrology Report`,
          Author: GENERATED_BY,
          Subject: "Vedic Astrology & AI Life Report",
          Creator: GENERATED_BY,
        },
      });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const generatedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      // ── 1. Cover Page ──────────────────────────────────────────────
      drawCoverPage(doc, { userData, chart, generatedDate });

      // ── 2. User Details / Birth Information ──────────────────────
      doc.addPage();
      sectionHeader(doc, "User Details & Birth Information");
      keyValueRow(doc, "Full Name", asciiOnly(userData.name));
      keyValueRow(doc, "Date of Birth", userData.dob);
      keyValueRow(doc, "Time of Birth", userData.tob);
      keyValueRow(doc, "Place of Birth", asciiOnly(userData.pob));
      keyValueRow(doc, "Ascendant (Lagna)", chart.lagna);

      // ── 3. Birth Chart Summary ────────────────────────────────────
      sectionHeader(doc, "Birth Chart Summary");
      keyValueRow(doc, "Lagna (Ascendant)", chart.lagna);
      keyValueRow(doc, "Moon Sign", chart.moonSign);
      keyValueRow(doc, "Sun Sign", chart.sunSign);
      if (chart.nakshatra) {
        keyValueRow(doc, "Nakshatra", `${chart.nakshatra.name || chart.nakshatra} (Pada ${chart.nakshatra.pada ?? "—"})`);
      }
      if (chart.numerology) {
        keyValueRow(doc, "Mulank (Birth Number)", chart.numerology.mulank);
        keyValueRow(doc, "Bhagyank (Destiny Number)", chart.numerology.bhagyank);
      }

      // ── 4. Planetary Positions ─────────────────────────────────────
      const planetEntries = Object.entries(chart.planetary || {});
      if (planetEntries.length) {
        sectionHeader(doc, "Planetary Positions");
        drawTable(doc, {
          headers: ["Planet", "Sign", "House"],
          rows: planetEntries.map(([planet, data]) => [asciiOnly(planet), data?.sign, data?.house]),
          weights: [2, 2, 1],
        });
      }

      // ── 5. House Placements ─────────────────────────────────────────
      if (planetEntries.length) {
        sectionHeader(doc, "House Placements");
        const byHouse = {};
        for (const [planet, data] of planetEntries) {
          if (!data?.house) continue;
          const key = data.house;
          if (!byHouse[key]) byHouse[key] = [];
          byHouse[key].push(asciiOnly(planet));
        }
        const rows = Array.from({ length: 12 }, (_, i) => i + 1).map((house) => [
          `House ${house}`,
          byHouse[house]?.length ? byHouse[house].join(", ") : "—",
        ]);
        drawTable(doc, { headers: ["House", "Planets Placed"], rows, weights: [1, 3] });
      }

      // ── 6. Planet Strength (reused from the existing engine) ───────
      let planetStrength = null;
      try {
        planetStrength = calcPlanetStrength(chart.planetary, chart.lagna, userData.dob, userData.tob);
      } catch (err) {
        logger.error("PDF report: Planet Strength engine call failed (non-fatal, section will be skipped):", err);
      }
      if (planetStrength && Object.keys(planetStrength).length) {
        sectionHeader(doc, "Planet Strength");
        drawTable(doc, {
          headers: ["Planet", "Dignity", "Retrograde", "Shadbala"],
          rows: Object.entries(planetStrength).map(([planet, p]) => [
            asciiOnly(planet),
            p?.dignity?.label || p?.dignity?.state || "—",
            p?.retrograde ? "Yes" : "No",
            p?.shadbala?.total ?? "—",
          ]),
          weights: [1.4, 1.6, 1, 1],
        });
      }

      // ── 7. Yogas ─────────────────────────────────────────────────
      sectionHeader(doc, "Yogas");
      if (Array.isArray(chart.yogas) && chart.yogas.length) {
        chart.yogas.forEach((y) => drawCard(doc, { title: y.name, body: y.detail, accent: GOOD, tag: "Beneficial Yoga" }));
      } else {
        paragraph(doc, report.yogas || "No major yoga detected based on available calculations.");
      }

      // ── 8. Doshas ────────────────────────────────────────────────
      sectionHeader(doc, "Doshas");
      if (Array.isArray(chart.doshas) && chart.doshas.length) {
        chart.doshas.forEach((d) => drawCard(doc, { title: d.name, body: d.detail, accent: WARN, tag: "Dosha" }));
      } else {
        paragraph(doc, report.doshas || "No major dosha detected based on available calculations.");
      }

      // ── 9. Numerology ────────────────────────────────────────────
      sectionHeader(doc, "Numerology");
      if (chart.numerology) {
        for (const [key, value] of Object.entries(chart.numerology)) {
          if (value === null || value === undefined || typeof value === "object") continue;
          keyValueRow(doc, titleCase(key), value);
        }
      } else {
        paragraph(doc, null, { fallback: "Numerology data not available." });
      }

      // ── 10. Nakshatra Profile ────────────────────────────────────
      const np = report.nakshatraProfile;
      sectionHeader(doc, "Nakshatra Profile");
      if (np) {
        keyValueRow(doc, "Nakshatra", np.nakshatra);
        keyValueRow(doc, "Ruling Lord", np.lord);
        keyValueRow(doc, "Pada", np.pada);
        keyValueRow(doc, "Symbol", np.symbol);
        keyValueRow(doc, "Deity", np.deity);
        keyValueRow(doc, "Gana", np.gana);
        keyValueRow(doc, "Nadi", np.nadi);
        keyValueRow(doc, "Yoni", np.yoni);
        keyValueRow(doc, "Nature", np.nature);
        doc.moveDown(0.4);
        subheading(doc, "Personality Traits");
        paragraph(doc, np.personality);
        subheading(doc, "Career Tendencies");
        paragraph(doc, np.careerTendencies);
        subheading(doc, "Relationship Tendencies");
        paragraph(doc, np.relationshipTendencies);
        subheading(doc, "Spiritual Tendencies");
        paragraph(doc, np.spiritualTendencies);
      } else {
        paragraph(doc, null, { fallback: "Nakshatra profile not available for this report." });
      }

      // ── 11. Dasha (Vimshottari) ────────────────────────────────────
      const dasha = report.dasha;
      sectionHeader(doc, "Dasha (Vimshottari Timeline)");
      if (dasha && dasha.available !== false) {
        if (dasha.currentMahadasha) {
          keyValueRow(
            doc,
            "Current Mahadasha",
            `${dasha.currentMahadasha.lord}  (${dasha.currentMahadasha.startDate} → ${dasha.currentMahadasha.endDate})`
          );
        }
        if (dasha.currentAntardasha) {
          keyValueRow(
            doc,
            "Current Antardasha",
            `${dasha.currentAntardasha.lord}  (${dasha.currentAntardasha.startDate} → ${dasha.currentAntardasha.endDate})`
          );
        }
        if (dasha.previousMahadasha) {
          keyValueRow(doc, "Previous Mahadasha", `${dasha.previousMahadasha.lord}  (${dasha.previousMahadasha.startDate} → ${dasha.previousMahadasha.endDate})`);
        }
        if (dasha.nextMahadasha) {
          keyValueRow(doc, "Next Mahadasha", `${dasha.nextMahadasha.lord}  (${dasha.nextMahadasha.startDate} → ${dasha.nextMahadasha.endDate})`);
        }
        doc.moveDown(0.6);
        subheading(doc, "Full Mahadasha Timeline");
        const timeline = Array.isArray(dasha.timeline) ? dasha.timeline : [];
        timeline.forEach((md, idx) => {
          drawTimelineEntry(doc, {
            heading: `${md.lord} Mahadasha`,
            period: `${md.startDate}  →  ${md.endDate}   (${md.durationYears} years)`,
            accent: idx % 2 === 0 ? PURPLE : GOLD_BRIGHT,
            isLast: idx === timeline.length - 1,
          });
        });
      } else {
        paragraph(doc, dasha?.reason, { fallback: "Dasha timeline not available for this report." });
      }

      // ── 12. Prediction Timeline ─────────────────────────────────────
      const timelineData = report.predictionTimeline;
      sectionHeader(doc, "Prediction Timeline");
      if (timelineData && (timelineData.oneYear?.length || timelineData.fiveYear?.length || timelineData.tenYear?.length)) {
        const spans = [
          ["1-Year Outlook", timelineData.oneYear],
          ["5-Year Outlook", timelineData.fiveYear],
          ["10-Year Outlook", timelineData.tenYear],
        ];
        spans.forEach(([label, entries]) => {
          if (!entries || !entries.length) return;
          subheading(doc, label);
          entries.forEach((e, idx) => {
            drawTimelineEntry(doc, {
              heading: e.category || "General",
              period: e.timePeriod || null,
              body: e.prediction,
              accent: PURPLE,
              isLast: idx === entries.length - 1,
            });
          });
          doc.moveDown(0.3);
        });
      } else {
        paragraph(doc, null, { fallback: "Prediction timeline not available for this report." });
      }

      // ── 13. Horoscope Summary ───────────────────────────────────────
      sectionHeader(doc, "Horoscope Summary");
      if (Array.isArray(report.predictions) && report.predictions.length) {
        report.predictions.forEach((p) => {
          const bits = [
            p.activeMahadasha && `Mahadasha: ${p.activeMahadasha}`,
            p.activeAntardasha && `Antardasha: ${p.activeAntardasha}`,
            p.dominantPlanet && `Dominant Planet: ${p.dominantPlanet}`,
            p.confidence?.label && `Confidence: ${p.confidence.label} (${p.confidence.score}/100)`,
          ].filter(Boolean).join("   ·   ");
          drawCard(doc, { title: p.category, body: p.prediction, accent: GOLD_BRIGHT, tag: bits || undefined });
        });
      } else {
        paragraph(doc, null, { fallback: "Horoscope summary not available for this report." });
      }

      // ── 14. Remedies ────────────────────────────────────────────────
      sectionHeader(doc, "Remedies");
      if (Array.isArray(chart.remedies) && chart.remedies.length) {
        chart.remedies.forEach((r) => drawCard(doc, { title: r.type, body: r.detail, accent: GOLD_BRIGHT }));
      } else {
        paragraph(doc, report.remedies || "No traditional remedy is suggested based on the currently calculated chart.");
      }

      // ── 15. AI Summary (existing explanation only) ───────────────────
      sectionHeader(doc, "AI-Generated Life Summary");
      paragraph(doc, report.lifeSummary);

      divider(doc);
      subheading(doc, "Narrative Highlights");
      const narrativeSections = [
        ["Love & Relationships", report.loveLife],
        ["Marriage", report.marriage],
        ["Career", report.career],
        ["Finance & Wealth", report.finance],
        ["Health", report.health],
      ];
      for (const [heading, text] of narrativeSections) {
        subheading(doc, heading);
        paragraph(doc, text);
      }

      // ── Header / footer pass on every page (branding + pagination) ──
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const isCover = i === range.start;
        const { width, height, margins } = doc.page;

        if (!isCover) {
          // Slim running header.
          doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8.5)
            .text("NAKSHATRAVERSE — PROFESSIONAL ASTROLOGY REPORT", margins.left, 24, { width: width - margins.left - margins.right, align: "left" });
          doc.moveTo(margins.left, 36).lineTo(width - margins.right, 36).strokeColor(BORDER).lineWidth(0.5).stroke();
        }

        // Footer: branding + page number, on every page including cover.
        const footerY = height - 34;
        doc.fillColor(isCover ? "#d9c7ff" : MUTED).font("Helvetica").fontSize(8)
          .text(GENERATED_BY, margins.left, footerY, { width: 200, align: "left" });
        doc.text(
          `Page ${i - range.start + 1} of ${range.count}`,
          width - margins.right - 200,
          footerY,
          { width: 200, align: "right" }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default { buildReportPdfBuffer };
