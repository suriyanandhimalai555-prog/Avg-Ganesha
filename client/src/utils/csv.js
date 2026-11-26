/*
  Shared CSV export helpers
  =========================
  toCsv(rows, columns)
    rows    – array of plain objects
    columns – array of { header: string, key: string | (row) => value }
    Returns an RFC-4180-compliant CSV string (all fields quoted, internal
    quotes doubled). Call downloadFile() to actually save it.

  downloadFile(content, filename, mimeType)
    Triggers a browser download without navigating away.
    Prepends a UTF-8 BOM so Excel opens the file correctly with non-ASCII
    characters (e.g. Tamil / Devanagari devotee names).
*/

// Escape a single CSV field value (RFC 4180).
const escapeField = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const toCsv = (rows, columns) => {
  const header = columns.map((c) => escapeField(c.header)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => escapeField(typeof c.key === 'function' ? c.key(row) : row[c.key]))
      .join(',')
  );
  return [header, ...lines].join('\r\n');
};

export const downloadFile = (content, filename, mimeType = 'text/csv;charset=utf-8;') => {
  const BOM = '﻿'; // UTF-8 BOM
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
