import { Fragment, memo } from "react";

// ─────────────────────────────────────────────────────────────────────────
// MarkdownLite — V3.0 Phase 4 (AI Astrology Assistant)
//
// A small, dependency-free renderer for the AI chat's markdown subset:
// paragraphs, **bold**, bullet lists ("-"/"*"), numbered lists ("1."), and
// simple "| a | b |" tables. Per the Phase 4 spec, code blocks are
// explicitly NOT supported — any ``` fence or `inline code` is stripped
// down to plain text rather than rendered as code, so a chat message can
// never render a code UI regardless of what the model returns (the
// backend prompt already forbids code blocks; this is defense in depth
// on the frontend too).
//
// No new npm dependency: the project's package.json intentionally ships
// only react/react-dom (see frontend/package.json), so this stays a tiny
// hand-rolled parser rather than pulling in react-markdown.
// ─────────────────────────────────────────────────────────────────────────

function renderInline(text, keyPrefix) {
  // Strip code fences/backticks first (never render as <code>), then bold.
  const clean = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, "")).replace(/`/g, "");
  const parts = clean.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "");
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-${i}`} style={{ color: "var(--nv-text-primary, #f1e4ff)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

function isTableSeparatorRow(line) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
}

function splitTableRow(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

function renderTable(lines, keyPrefix) {
  const header = splitTableRow(lines[0]);
  const rows = lines.slice(2).map(splitTableRow);
  return (
    <div key={keyPrefix} style={{ overflowX: "auto", margin: "10px 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th key={i} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--nv-accent-border, rgba(180,120,255,0.35))", color: "var(--nv-text-primary, #e8d5ff)", fontWeight: 700 }}>
                {renderInline(cell, `${keyPrefix}-h${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} style={{ padding: "6px 10px", borderBottom: "1px solid var(--nv-surface-border, rgba(180,120,255,0.12))", color: "var(--nv-text-primary, rgba(220,190,255,0.88))" }}>
                  {renderInline(cell, `${keyPrefix}-c${r}-${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseBlocks(text) {
  // Code fences are never treated as code — collapse them to their inner
  // text (backticks removed) before any other parsing happens.
  const sanitized = (text || "").replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
  const lines = sanitized.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // Table: a "| ... |" header line immediately followed by a separator row.
    if (line.includes("|") && lines[i + 1] && isTableSeparatorRow(lines[i + 1])) {
      const tableLines = [line, lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim()) {
        tableLines.push(lines[j]);
        j++;
      }
      blocks.push({ type: "table", lines: tableLines });
      i = j;
      continue;
    }

    // Bullet list.
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      let j = i;
      while (j < lines.length && /^\s*[-*]\s+/.test(lines[j])) {
        items.push(lines[j].replace(/^\s*[-*]\s+/, ""));
        j++;
      }
      blocks.push({ type: "ul", items });
      i = j;
      continue;
    }

    // Numbered list.
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      let j = i;
      while (j < lines.length && /^\s*\d+[.)]\s+/.test(lines[j])) {
        items.push(lines[j].replace(/^\s*\d+[.)]\s+/, ""));
        j++;
      }
      blocks.push({ type: "ol", items });
      i = j;
      continue;
    }

    // Paragraph: consume until the next blank line or a line that starts
    // a different block type.
    const paraLines = [];
    let j = i;
    while (
      j < lines.length &&
      lines[j].trim() &&
      !/^\s*[-*]\s+/.test(lines[j]) &&
      !/^\s*\d+[.)]\s+/.test(lines[j]) &&
      !(lines[j].includes("|") && lines[j + 1] && isTableSeparatorRow(lines[j + 1]))
    ) {
      paraLines.push(lines[j]);
      j++;
    }
    blocks.push({ type: "p", text: paraLines.join(" ") });
    i = j;
  }
  return blocks;
}

function MarkdownLite({ text }) {
  const blocks = parseBlocks(text);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        if (block.type === "table") return renderTable(block.lines, key);
        if (block.type === "ul") {
          return (
            <ul key={key} style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
              {block.items.map((item, idx) => (
                <li key={idx} style={{ lineHeight: 1.6 }}>{renderInline(item, `${key}-${idx}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={key} style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
              {block.items.map((item, idx) => (
                <li key={idx} style={{ lineHeight: 1.6 }}>{renderInline(item, `${key}-${idx}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={key} style={{ margin: 0, lineHeight: 1.65 }}>
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}

export default memo(MarkdownLite);
