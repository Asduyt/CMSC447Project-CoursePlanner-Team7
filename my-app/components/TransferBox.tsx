"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type MdRow = { course: string; credits: number | null; transfersAs: string };

// supported Maryland Community Colleges in the ARTSYS website
const MARYLAND_SCHOOLS: { id: number; name: string }[] = [
  { id: 1725, name: "Allegany College of Maryland"},
  { id: 1726, name: "Anne Arundel Community College"},
  { id: 1730, name: "Baltimore City Community College"},
  { id: 4839, name: "Carroll Community College"},
  { id: 1736, name: "Cecil College"},
  { id: 1738, name: "Chesapeake College"},
  { id: 1737, name: "College of Southern Maryland"},
  { id: 5209, name: "Community College of Baltimore County (CCBC)"},
  { id: 1743, name: "Frederick Community College"},
  { id: 1745, name: "Garrett College"},
  { id: 1749, name: "Hagerstown Community College"},
  { id: 1750, name: "Harford Community College"},
  { id: 1752, name: "Howard Community College"},
  { id: 1768, name: "Montgomery College"},
  { id: 10259, name: "Prince George's Community College"},
  { id: 1792, name: "Wor-Wic Community College"},
];

export default function TransferBox({ onDelete, onCreditsChange, onCourseChange, onRowsChange }: { onDelete?: () => void; onCreditsChange?: (total: number) => void; onCourseChange?: (prevCode: string | null, nextCode: string | null) => void; onRowsChange?: (rows: { code: string; credits: number }[]) => void }) {
  // small css helpers to keep JSX simple and readable
  const styles: Record<string, CSSProperties> = {
    card: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: 12,
    },
    button: {
      background: "var(--surface)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
      padding: "6px 10px",
      borderRadius: 6,
      cursor: "pointer",
    },
    smallButton: {
      padding: "6px 8px",
      borderRadius: 6,
      cursor: "pointer",
    },
    select: {
      background: "var(--surface)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      width: "100%",
    },
    input: {
      background: "var(--surface)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      padding: "6px 8px",
      width: "100%",
    },
    numberInput: {
      width: 64,
      background: "var(--surface)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      padding: "6px 8px",
      textAlign: "center",
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      background: "var(--surface)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: 16,
      width: "min(900px, 95vw)",
      maxHeight: "80vh",
      overflow: "auto",
    },
    tableHeaderCell: {
      textAlign: "left",
      padding: 8,
      borderBottom: "1px solid var(--border)",
    },
    footerPrimary: {
      padding: "6px 10px",
      borderRadius: 6,
      background: "var(--primary, #007bff)",
      color: "white",
      border: "none",
    },
    footerSecondary: {
      padding: "6px 10px",
      border: "1px solid var(--border)",
      borderRadius: 6,
      background: "var(--surface)",
      color: "var(--foreground)",
    },
  };
  // Each transfer row stores its own id, selected target university, and the typed course name
  const [rows, setRows] = useState<{ id: number; transferTo: string; course: string; credits: string }[]>([
    { id: 0, transferTo: "", course: "", credits: "" },
    { id: 1, transferTo: "", course: "", credits: "" },
  ]);

  // extract a basic course code like "CMSC201" from a longer string
  function extractCode(text: string): string {
    if (!text) return text as any;
    const s = String(text).trim();
    // consider only the part before a dash (handles if we have like "CMSC201 - Title")
    let head = s;
    const dashIdx = (() => {
      const i1 = s.indexOf("-");
      const i2 = s.indexOf("–");
      const i3 = s.indexOf("—");
      let idx = -1;
      if (i1 >= 0) idx = i1;
      if (i2 >= 0 && (idx === -1 || i2 < idx)) idx = i2;
      if (i3 >= 0 && (idx === -1 || i3 < idx)) idx = i3;
      return idx;
    })();
    if (dashIdx >= 0) head = s.slice(0, dashIdx).trim();

    // i try spaced patterns like "CMSC 201"
    const parts = head.split(/\s+/);
    if (parts.length >= 2) {
      const subj = parts[0].toUpperCase();
      const num = parts[1].toUpperCase();
      const subjOk = /^[A-Z]{2,6}$/.test(subj);
      const numOk = /^(\d{3}[A-Z]?|\dXX|4XX|UL|ELECT|[A-Z]{1,3})$/.test(num);
      if (subjOk && numOk) return `${subj}${num}`;
    }
    //then try unspaced patterns like "CMSC201"
    const up = head.toUpperCase();
    const m = /^([A-Z]{2,6})(\d{3}[A-Z]?|\dXX|4XX|UL|ELECT)$/.exec(up);
    if (m) return `${m[1]}${m[2]}`;
    return head;
  }

  // 
  const addCourse = () =>
    setRows((prev) => [...prev, { id: (prev.at(-1)?.id ?? -1) + 1, transferTo: "", course: "", credits: "" }]);

  // delete a course by its internal id
  const deleteCourse = (id: number) => {
    setRows((prev) => {
  const next = prev.filter((x) => x.id !== id);
  return next;
    });
  };

  // set transfer target university
  const setTransferTarget = (id: number, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, transferTo: value } : r)));
  };

  // set course name value
  const setCourseValue = (id: number, value: string) =>
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, course: value } : r));
      return next;
    });

  // set credits value
  const setCreditsValue = (id: number, value: string) =>
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, credits: value } : r));
      return next;
    });

  const universities = ["UMBC", "Towson University", "Johns Hopkins University", "UMD - College Park", "Community College", "Other"];

  // compute credits
  const creditTotal = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.credits) || 0), 0);
  }, [rows]);
  // report the credits to parent whenever the total changes since when they add it, we need to keep track
  useEffect(() => {
    onCreditsChange?.(creditTotal);
  }, [creditTotal]);

  // Notify parent with normalized rows after rows change to avoid parent update during child render
  const lastRowsSigRef = useRef<string>("");
  useEffect(() => {
    if (!onRowsChange) return;
    const mapped = rows
      .filter((r) => !!r.course)
      .map((r) => ({ code: extractCode(r.course), credits: parseFloat(r.credits) || 0 }));
    const sig = mapped
      .map((r) => `${String(r.code).replace(/\s+/g, "").toUpperCase()}|${r.credits || 0}`)
      .sort()
      .join("||");
    if (sig === lastRowsSigRef.current) return;
    lastRowsSigRef.current = sig;
    onRowsChange(mapped);
  }, [rows]);

  // maryland CC modal state
  const [mdOpen, setMdOpen] = useState(false);
  const [mdPrefix, setMdPrefix] = useState("");
  const [mdOldSchool, setMdOldSchool] = useState("");
  const [mdSchool, setMdSchool] = useState<number>(5209);
  const [mdLoading, setMdLoading] = useState(false);
  const [mdError, setMdError] = useState<string | null>(null);
  const [mdRows, setMdRows] = useState<MdRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const mdCountSelected = selectedRows.length;

  // run the lookup against our API
  async function runMdLookup() {
    try {
      setMdLoading(true);
      setMdError(null);
      setMdRows([]);
  setSelectedRows([]);
      const res = await fetch("/api/md-cc-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formerSchool: mdSchool,
          umbcPrefix: mdPrefix,
          oldSchoolClass: mdOldSchool || undefined,
        }),
      });
      // if we get an error from our API, throw an error
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      // get the the data
      const data: { rows: MdRow[] } = await res.json();
      setMdRows(data.rows || []);
      // more error checking...
    } catch (e: any) {
      setMdError(e?.message || "Lookup failed");
    } finally {
      setMdLoading(false);
    }
  }

  // Toggle selection of a result row by index
  function toggleRow(i: number) {
    setSelectedRows((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  // when we choose a class, we need to add have it "copy over" and paste into our schedule
  function addSelectedToSchedule() {
  const schoolName = MARYLAND_SCHOOLS.find((s) => s.id === mdSchool)?.name ?? "Maryland CC";
  const chosen = mdRows.filter((_, i) => selectedRows.includes(i)).filter((r) => !!r.transfersAs);
    // this mean we didn't get anything
    if (chosen.length === 0) {
      setMdOpen(false);
      return;
    }
    // best way that could be done...
  setRows((prev) => {
      let nextId = (prev.at(-1)?.id ?? -1) + 1;
      const appended = chosen.map((r) => ({
        id: nextId++,
        transferTo: schoolName,
        course: r.transfersAs,
        credits: r.credits != null ? String(r.credits) : "",
      }));
      const next = [...prev, ...appended];
      return next;
    });

  // i set it so that it closes and reset the model so it starts fresh next time you want to add more transfer classes
  setMdOpen(false);
  setMdRows([]);
  setSelectedRows([]);
  setMdPrefix("");
  setMdOldSchool("");
  setMdSchool(5209);
  setMdError(null);
  setMdLoading(false);
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontWeight: 600 }}>Transfer</h4>
        <div style={{ marginLeft: "auto" }}>
          {onDelete && (
            <button type="button" onClick={onDelete} style={styles.smallButton} title="Remove transfer box">
              Remove
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row) => (
          <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>

            {/* transfer select on the left, styled like course dropdown boxes */}
            <div style={{ width: 220, display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Transfer from</label>
              <select aria-label="Transfer from" value={row.transferTo} onChange={(e) => setTransferTarget(row.id, e.target.value)} style={styles.select}>
                <option value="">Select university</option>
                {universities.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Course input on the right (plain text input for transfer courses) */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* adjust marginLeft so the label lines up with the input start (accounts for delete button space) */}
              <label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, marginLeft: 36 }}>
                Course to transfer
              </label>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                <input type="text" placeholder="Type course name" value={row.course} onChange={(e) => setCourseValue(row.id, e.target.value)} style={{ ...styles.input, flex: 1, minWidth: 0 }} />

                {/* credits input: small numeric field */}
                <input type="number" inputMode="numeric" min={0} placeholder="Cr" value={row.credits} onChange={(e) => setCreditsValue(row.id, e.target.value)} style={{ ...styles.numberInput, marginLeft: 8 }} />

                <button
                  type="button"
                  onClick={() => deleteCourse(row.id)}
                  aria-label="Delete transfer row"
                  title="Delete row"
                  style={{
                    marginLeft: 8,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                    color: "var(--foreground)",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={addCourse} style={styles.button}>
          + Add Course
        </button>
        <button type="button" onClick={() => setMdOpen(true)} style={{ ...styles.button, marginLeft: 8 }}>
          Transfer from Maryland-based Community College
        </button>
      </div>

      {mdOpen && (
        <div style={styles.modalOverlay} onClick={() => setMdOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Maryland Community College Transfers</h3>
              <button onClick={() => setMdOpen(false)} style={{ border: "none", background: "transparent", fontSize: 18 }}>×</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Maryland Community College:</label>
                <select value={mdSchool} onChange={(e) => setMdSchool(parseInt(e.target.value))} style={styles.select}>
                  {MARYLAND_SCHOOLS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ width: 180 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>UMBC prefix:</label>
                <input value={mdPrefix} onChange={(e) => setMdPrefix(e.target.value.toUpperCase())} placeholder="e.g., CMSC, MATH" style={styles.input} />
              </div>
              <div style={{ width: 220 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Former school class/prefix (optional):</label>
                <input value={mdOldSchool} onChange={(e) => setMdOldSchool(e.target.value.toUpperCase())} placeholder="e.g., MATH, PSYC" style={styles.input} />
              </div>
              <div style={{ display: "flex", alignItems: "end" }}>
                <button
                  onClick={runMdLookup}
                  disabled={mdLoading || (!mdPrefix && !mdOldSchool)}
                  style={{ ...styles.button, opacity: mdLoading ? 0.7 : (!mdPrefix && !mdOldSchool ? 0.6 : 1) }}
                >
                  {/* this is my loading screen since its a lot easier lol */}
                  {mdLoading ? "Loading..." : "Run"}
                </button>
              </div>
            </div>

            {mdError && <div style={{ color: "red", marginBottom: 8 }}>{mdError}</div>}

            <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeaderCell}>Select</th>
                    <th style={styles.tableHeaderCell}>Course</th>
                    <th style={styles.tableHeaderCell}>Credits</th>
                    <th style={styles.tableHeaderCell}>Transfers as</th>
                  </tr>
                </thead>
                <tbody>
                  {mdRows.length === 0 && !mdLoading ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 12, color: "var(--muted)" }}>No results</td>
                    </tr>
                  ) : (
                    mdRows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(i)}
                            onChange={() => toggleRow(i)}
                          />
                        </td>
                        <td style={{ padding: 8 }}>{r.course}</td>
                        <td style={{ padding: 8 }}>{r.credits ?? ""}</td>
                        <td style={{ padding: 8 }}>{r.transfersAs}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "var(--muted)" }}>{mdCountSelected} selected</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setMdOpen(false)} style={styles.footerSecondary}>Close</button>
                <button onClick={addSelectedToSchedule} disabled={selectedRows.length === 0} style={{ ...styles.footerPrimary, opacity: selectedRows.length === 0 ? 0.6 : 1 }} > Add to schedule </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

