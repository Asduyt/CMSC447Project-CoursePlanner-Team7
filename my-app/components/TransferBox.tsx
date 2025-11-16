"use client";

// TransferBox lets the user add courses they are bringing in from other schools.
// It also has a lookup for Maryland Community College transfers.
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type MdRow = { course: string; credits: number | null; transfersAs: string };

// supported Maryland Community Colleges in the ARTSYS website
// List of supported Maryland community colleges (id from ARTSYS site)
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

// We now add an optional grade per transfer course (same letter list as planner cells).
export default function TransferBox({ id, onDelete, onCreditsChange, onRowsChange }: { id: number; onDelete?: () => void; onCreditsChange?: (total: number) => void; onRowsChange?: (id: number, rows: { id: number; transferTo: string; course: string; credits: string; grade?: string | null }[]) => void }) {
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
  // each row is one transfer course line
  const [rows, setRows] = useState<{ id: number; transferTo: string; course: string; credits: string; grade?: string | null }[]>([
    { id: 0, transferTo: "", course: "", credits: "", grade: null },
    { id: 1, transferTo: "", course: "", credits: "", grade: null },
  ]);

  // add a blank transfer row
  const addCourse = () => setRows((prev) => [...prev, { id: (prev.at(-1)?.id ?? -1) + 1, transferTo: "", course: "", credits: "", grade: null }]);

  // delete a transfer row
  const deleteCourse = (id: number) => setRows((prev) => prev.filter((x) => x.id !== id));

  // change the "transfer from" selection
  const setTransferTarget = (id: number, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, transferTo: value } : r)));
  };

  // change the course text
  const setCourseValue = (id: number, value: string) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, course: value } : r)));

  // change the credits number
  const setCreditsValue = (id: number, value: string) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, credits: value } : r)));

  // set grade (simple letter). We store as null when blank.
  const setGradeValue = (id: number, value: string) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, grade: value || null } : r)));

  const universities = ["UMBC", "Towson University", "Johns Hopkins University", "Community College", "Other"];

  // compute credits
  // total credits from all transfer rows
  const creditTotal = useMemo(() => rows.reduce((sum, r) => sum + (parseFloat(r.credits) || 0), 0), [rows]);
  // report the credits to parent whenever the total changes since when they add it, we need to keep track
  useEffect(() => {
    onCreditsChange?.(creditTotal);
  }, [creditTotal]);

  // report rows to parent for export snapshots whenever rows change
  useEffect(() => {
    onRowsChange?.(id, rows);
  }, [rows, id]);

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
  // run community college lookup (hits our API route)
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
  // select/unselect a result row
  function toggleRow(i: number) {
    setSelectedRows((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  // when we choose a class, we need to add have it "copy over" and paste into our schedule
  // copy selected lookup rows into main transfer rows
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
        grade: null,
      }));
      return [...prev, ...appended];
    });

    setMdOpen(false);
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
                {/* grade dropdown (optional) */}
                <select
                  aria-label="Transfer grade"
                  value={row.grade ?? ""}
                  onChange={(e) => setGradeValue(row.id, e.target.value)}
                  style={{ ...styles.select, width: 90, marginLeft: 8 }}
                >
                  <option value="">Grade</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="W">W</option>
                </select>

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

