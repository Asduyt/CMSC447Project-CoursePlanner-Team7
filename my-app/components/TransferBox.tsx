"use client";

import { useState } from "react";

export default function TransferBox({ onDelete }: { onDelete?: () => void }) {
  // Each transfer row stores its own id, selected target university, and the typed course name
  const [rows, setRows] = useState<{ id: number; transferTo: string; course: string; credits: string }[]>([
    { id: 0, transferTo: "", course: "", credits: "" },
    { id: 1, transferTo: "", course: "", credits: "" },
  ]);

  const addCourse = () =>
    setRows((prev) => [...prev, { id: (prev.at(-1)?.id ?? -1) + 1, transferTo: "", course: "", credits: "" }]);

  const deleteCourse = (id: number) => setRows((prev) => prev.filter((x) => x.id !== id));

  const setTransferTarget = (id: number, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, transferTo: value } : r)));
  };

  const setCourseValue = (id: number, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, course: value } : r)));

  const setCreditsValue = (id: number, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, credits: value } : r)));

  const universities = ["UMBC", "Towson University", "Johns Hopkins University", "Community College", "Other"];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontWeight: 600 }}>Transfer</h4>
        <div style={{ marginLeft: "auto" }}>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              style={{ padding: "6px 8px", borderRadius: 6, cursor: "pointer" }}
              title="Remove transfer box"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row) => (
          <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Transfer select on the left, styled like course dropdown boxes */}
            <div style={{ width: 220, display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Transfer from</label>
              <select
                aria-label="Transfer from"
                value={row.transferTo}
                onChange={(e) => setTransferTarget(row.id, e.target.value)}
                className="px-2 py-1"
                style={{
                  // match Cell input padding/line-height so the select lines up exactly with the course input
                  borderRadius: 6,
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  width: "100%",
                  lineHeight: 1,
                }}
              >
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
                <input
                  type="text"
                  placeholder="Type course name"
                  value={row.course}
                  onChange={(e) => setCourseValue(row.id, e.target.value)}
                  style={{
                    background: "var(--surface)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "6px 8px",
                    flex: 1,
                    minWidth: 0,
                  }}
                />

                {/* credits input: small numeric field */}
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Cr"
                  value={row.credits}
                  onChange={(e) => setCreditsValue(row.id, e.target.value)}
                  style={{
                    width: 64,
                    marginLeft: 8,
                    background: "var(--surface)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "6px 8px",
                    textAlign: "center",
                  }}
                />

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
        <button
          type="button"
          onClick={addCourse}
          style={{
            background: "var(--surface)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            padding: "6px 10px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          + Add Course
        </button>
      </div>
    </div>
  );
}

