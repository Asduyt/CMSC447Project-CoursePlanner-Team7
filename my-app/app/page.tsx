"use client";

// Main planner page. Simple comments explain each part.
import { useMemo, useState } from "react";
import { computeRequirementsSummary } from "@/lib/requirementsSummary";
import ThemeToggle from "@/components/ThemeToggle";
import Year from "@/components/Year";
import TransferBox from "@/components/TransferBox";
import RequirementsSidebar from "@/components/RequirementsSidebar";

export default function Home() {
  // used to force re-render of children on clear
  const [resetCount, setResetCount] = useState(0);
  // list of transfer box ids
  const [transferIds, setTransferIds] = useState<number[]>([]);
  // if true we add suggested courses automatically
  const [prefillOn, setPrefillOn] = useState(false);
  // Snapshots for export: per-semester planned courses and per-transfer-box rows
  // semester snapshots now include optional grade per course
  const [semesterSnapshots, setSemesterSnapshots] = useState<Record<string, { code: string; name: string; credits: number; grade?: string | null }[]>>({});
  // transfer snapshots now can include optional grade
  const [transferSnapshots, setTransferSnapshots] = useState<Record<number, { id: number; transferTo: string; course: string; credits: string; grade?: string | null }[]>>({});
  
  // State for additional Winter/Summer semesters
  const [additionalSemesters, setAdditionalSemesters] = useState<{[key: string]: boolean;}>({});

  // Modal state for adding Winter/Summer semester
  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false);
  const [newSemesterType, setNewSemesterType] = useState<"Winter" | "Summer">("Winter");
  const [newSemesterYear, setNewSemesterYear] = useState(1);

  // add a new transfer box with a new id number
  const addGlobalTransfer = () => {
    setTransferIds((prev) => [...prev, (prev.at(-1) ?? -1) + 1]);
  };
  // remove a transfer box by id
  const removeGlobalTransfer = (id: number) => {
    setTransferIds((prev) => prev.filter((x) => x !== id));
  };
  // track credits for transfer boxes by id
  const [transferCredits, setTransferCredits] = useState<Record<number, number>>({});
  const totalTransferCredits = useMemo(() => Object.values(transferCredits).reduce((a, b) => a + b, 0), [transferCredits]);
  
  const addSemester = () => {
    const key = `${newSemesterType.toLowerCase()}_${newSemesterYear}`;
    setAdditionalSemesters((prev) => ({ ...prev, [key]: true }));
    setShowAddSemesterModal(false);
  };
  
  const removeSemester = (type: string, year: number) => {
    const key = `${type.toLowerCase()}_${year}`;
    setAdditionalSemesters((prev) => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });

    // reset credit counts for if u removed optional semester (like summer/winter) so the year and total update correctly
    const lower = type.toLowerCase();
    if (lower === "winter") {
      if (year === 1) setY1Winter(0);
      else if (year === 2) setY2Winter(0);
      else if (year === 3) setY3Winter(0);
      else if (year === 4) setY4Winter(0);
    } else if (lower === "summer") {
      if (year === 1) setY1Summer(0);
      else if (year === 2) setY2Summer(0);
      else if (year === 3) setY3Summer(0);
      else if (year === 4) setY4Summer(0);
    }
  };
  
  // track credits for each semester to help us show it
  const [y1Fall, setY1Fall] = useState(0);
  const [y1Spring, setY1Spring] = useState(0);
  const [y1Winter, setY1Winter] = useState(0);
  const [y1Summer, setY1Summer] = useState(0);
  const [y2Fall, setY2Fall] = useState(0);
  const [y2Spring, setY2Spring] = useState(0);
  const [y2Winter, setY2Winter] = useState(0);
  const [y2Summer, setY2Summer] = useState(0);
  const [y3Fall, setY3Fall] = useState(0);
  const [y3Spring, setY3Spring] = useState(0);
  const [y3Winter, setY3Winter] = useState(0);
  const [y3Summer, setY3Summer] = useState(0);
  const [y4Fall, setY4Fall] = useState(0);
  const [y4Spring, setY4Spring] = useState(0);
  const [y4Winter, setY4Winter] = useState(0);
  const [y4Summer, setY4Summer] = useState(0);

  const y1 = y1Fall + y1Spring + y1Winter + y1Summer;
  const y2 = y2Fall + y2Spring + y2Winter + y2Summer;
  const y3 = y3Fall + y3Spring + y3Winter + y3Summer;
  const y4 = y4Fall + y4Spring + y4Winter + y4Summer;
  const total = y1 + y2 + y3 + y4 + totalTransferCredits;
  
  // Track selected course codes across all semesters to drive requirements sidebar
  const [selectedCodes, setSelectedCodes] = useState<Map<string, number>>(new Map());

  // update course counts when a cell changes
  const handleCourseChange = (prevCode: string | null, nextCode: string | null) => {
    setSelectedCodes((prev) => {
      const map = new Map(prev);
      const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();
      if (prevCode) {
        const oldKey = norm(prevCode);
        const oldCount = (map.get(oldKey) ?? 0) - 1;
        if (oldCount <= 0) map.delete(oldKey); else map.set(oldKey, oldCount);
      }
      if (nextCode) {
        const newKey = norm(nextCode);
        map.set(newKey, (map.get(newKey) ?? 0) + 1);
      }
      return map;
    });
  };
  
  // Arrays to map Year components
  const years = [1, 2, 3, 4] as const;
  const yearTotals: Record<number, number> = { 1: y1, 2: y2, 3: y3, 4: y4 };
  const fallSetters: Record<number, (n: number) => void> = {
    1: setY1Fall,
    2: setY2Fall,
    3: setY3Fall,
    4: setY4Fall,
  };
  const springSetters: Record<number, (n: number) => void> = {
    1: setY1Spring,
    2: setY2Spring,
    3: setY3Spring,
    4: setY4Spring,
  };

  // helpers for the winter/summer setters
  const getWinterSetter = (year: number) => {
    if (year === 1) return setY1Winter;
    if (year === 2) return setY2Winter;
    if (year === 3) return setY3Winter;
    return setY4Winter;
  };

  const getSummerSetter = (year: number) => {
    if (year === 1) return setY1Summer;
    if (year === 2) return setY2Summer;
    if (year === 3) return setY3Summer;
    return setY4Summer;
  };

  // helpers for the pathways presets
  const getYearPresets = (year: number) => {
    if (!prefillOn) return undefined;
    if (year === 1) {
      return {
        fall: ["CMSC 201", "MATH 151", "LANG 201", "ENGL GEP"],
        spring: ["CMSC 202", "MATH 152", "CMSC 203", "AH GEP", "SS GEP"],
      };
    }
    if (year === 2) {
      return {
        fall: ["CMSC 331", "CMSC 341", "SCI SEQ I", "SS GEP", "ELECTIVE"],
        spring: ["CMSC 313", "MATH 221", "SCI SEQ II", "SCI LAB GEP", "SS GEP"],
      };
    }
    if (year === 3) {
      return {
        fall: ["CMSC 304", "CMSC 411", "CMSC 4XX - TEC", "STAT 355"],
        spring: ["CMSC 421", "CMSC 4XX - CS", "CMSC 4XX - TEC", "AH GEP", "C GEP"],
      };
    }
    return {
      fall: ["CMSC 441", "CMSC 447", "UL ELECT", "ELECTIVE", "ELECTIVE"],
      spring: ["CMSC 4XX - CS", "CMSC 4XX - TEC", "ELECTIVE", "ELECTIVE", "ELECTIVE"],
    };
  };

  // clear everything back to empty
  const clearSchedule = () => {
    setTransferIds([]);
    setTransferCredits({});
    setAdditionalSemesters({});
  setSemesterSnapshots({});
  setTransferSnapshots({});
    // reset selections
    setSelectedCodes(new Map());
    // reset all per-semester credits
    setY1Fall(0); setY1Spring(0); setY1Winter(0); setY1Summer(0);
    setY2Fall(0); setY2Spring(0); setY2Winter(0); setY2Summer(0);
    setY3Fall(0); setY3Spring(0); setY3Winter(0); setY3Summer(0);
    setY4Fall(0); setY4Spring(0); setY4Winter(0); setY4Summer(0);
    // close modal and clear all the models so we start from scratch
    setShowAddSemesterModal(false);
    setPrefillOn(false);
    setResetCount((n) => n + 1);
  };

  // Export helpers
  function exportCSV() {
    // headers
  const rows: string[][] = [["Type","Year","Semester","Code","Name","Credits","Grade","Transfer From","Counted Courses"]];
    // planned courses by semester in order
    const orderSeasons = ["Fall","Winter","Spring","Summer"];
    const semesterKeys = Object.keys(semesterSnapshots)
      .map((k) => {
        const [yStr, s] = k.split(":");
        return { key: k, year: parseInt(yStr, 10), season: s };
      })
      .sort((a, b) => (a.year - b.year) || (orderSeasons.indexOf(a.season) - orderSeasons.indexOf(b.season)));
    for (const { key, year, season } of semesterKeys) {
      const list = semesterSnapshots[key] || [];
      for (const c of list) {
  rows.push(["Planned", String(year), season, c.code, c.name, String(c.credits ?? 0), c.grade ? String(c.grade) : "", "", "" ]);
      }
    }
    // transfer rows
    const transferIds = Object.keys(transferSnapshots).map((x) => parseInt(x, 10)).sort((a,b)=>a-b);
    for (const id of transferIds) {
      const list = transferSnapshots[id] || [];
      for (const r of list) {
        if (!r.course) continue;
        rows.push(["Transfer","","", r.course, "", r.credits || "", r.grade ? r.grade : "", r.transferTo || "", ""]);
      }
    }

    // requirements summary section (improved formatting)
    rows.push([]); // blank line separator
    rows.push(["Requirements Summary"]);
    const reqSummary = computeRequirementsSummary(selectedCodes);
    // Header for requirement details
  rows.push(["Requirement Name","Progress","Type","Completed","Total","Counted Courses"]);
    for (const r of reqSummary) {
      const progress = r.type === 'credit' ? `${r.completed}/${r.total} cr (${r.percent}%)` : `${r.completed}/${r.total} (${r.percent}%)`;
      rows.push([
        r.name,
        progress,
        r.type,
        String(r.completed),
        String(r.total),
        r.countedCourseCodes.join('; ')
      ]);
    }
    const csv = rows.map((r) => r.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "planner.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text("UMBC COEIT Course Planner", 10, y);
    y += 8;
    doc.setFontSize(11);
    // planned courses grouped by semester
    const orderSeasons = ["Fall","Winter","Spring","Summer"];
    const semesterKeys = Object.keys(semesterSnapshots)
      .map((k) => {
        const [yStr, s] = k.split(":");
        return { key: k, year: parseInt(yStr, 10), season: s };
      })
      .sort((a, b) => (a.year - b.year) || (orderSeasons.indexOf(a.season) - orderSeasons.indexOf(b.season)));
    for (const { key, year, season } of semesterKeys) {
      doc.text(`Year ${year} - ${season}`, 10, y);
      y += 6;
      const list = semesterSnapshots[key] || [];
      for (const c of list) {
        const gradePart = c.grade ? ` | Grade: ${c.grade}` : "";
        doc.text(`- ${c.code} ${c.name} (${c.credits} cr${gradePart})`, 14, y);
        y += 6;
        if (y > 280) { doc.addPage(); y = 10; }
      }
      y += 4;
      if (y > 280) { doc.addPage(); y = 10; }
    }
    // transfers
  doc.text("Transfers", 10, y);
    y += 6;
    const transferIds = Object.keys(transferSnapshots).map((x) => parseInt(x, 10)).sort((a,b)=>a-b);
    for (const id of transferIds) {
      const list = transferSnapshots[id] || [];
      for (const r of list) {
        if (!r.course) continue;
        const gradePart = r.grade ? ` | Grade: ${r.grade}` : "";
        const line = `- ${r.course}${r.credits ? ` (${r.credits} cr)` : ""}${r.transferTo ? ` from ${r.transferTo}` : ""}${gradePart}`;
        doc.text(line, 14, y);
        y += 6;
        if (y > 280) { doc.addPage(); y = 10; }
      }
    }
    // Requirements section
    if (y > 260) { doc.addPage(); y = 10; }
    doc.setFontSize(13);
    doc.text("Requirements", 10, y);
    y += 6;
    doc.setFontSize(10);
    const reqSummary = computeRequirementsSummary(selectedCodes);
    for (const r of reqSummary) {
      const progress = r.type === 'credit' ? `${r.completed}/${r.total} cr (${r.percent}%)` : `${r.completed}/${r.total} (${r.percent}%)`;
      // Bold requirement name + progress
      doc.setFont('helvetica','bold');
      const headerLine = `${r.name}: ${progress}`;
      const headerSplit = doc.splitTextToSize(headerLine, 190);
      for (const part of headerSplit) {
        doc.text(part, 12, y);
        y += 5;
        if (y > 280) { doc.addPage(); y = 10; doc.setFontSize(10); }
      }
      // Normal font for counted courses if any
      doc.setFont('helvetica','normal');
      if (r.countedCourseCodes.length) {
        const counted = `Counted: ${r.countedCourseCodes.join(', ')}`;
        const countedSplit = doc.splitTextToSize(counted, 186);
        for (const part of countedSplit) {
          doc.text(part, 14, y);
          y += 5;
          if (y > 280) { doc.addPage(); y = 10; doc.setFontSize(10); }
        }
      }
      y += 2;
      if (y > 280) { doc.addPage(); y = 10; doc.setFontSize(10); }
    }

    doc.save("planner.pdf");
  }
  
  return (
    // the main page layout
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <header className="row-start-1 w-full flex justify-center">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* title and dark/light mode toggle */}
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>UMBC COEIT Course Planner</h1>
          <ThemeToggle />
          {/* turn on/off suggested courses */}
          <button
            onClick={() => setPrefillOn((v) => !v)}
            style={{
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          > Prefill Pathways 
          </button>
          {/* Export buttons */}
          <button
            onClick={exportCSV}
            style={{
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          > Export CSV
          </button>
          <button
            onClick={exportPDF}
            style={{
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          > Export PDF
          </button>
          <button
            onClick={clearSchedule}
            style={{
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          > Clear Schedule
          </button>
              {/* add a new transfer box */}
              <button
                onClick={addGlobalTransfer}
                style={{
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Add Transfer
              </button>
              
              {/* open modal to add winter/summer */}
              <button
                onClick={() => setShowAddSemesterModal(true)}
                style={{
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                + Winter/Summer
              </button>
          
        </div>
      </header>
  {/* main content with transfers, years and requirements */}
      <main className="row-start-2 w-full" style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", maxWidth: 1400 }}>
          <div
            key={resetCount}
            style={{
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 16,
              width: "100%",
              maxWidth: 1000,
            }}
          >
          {/* for now, i just copied and pasted and just changed the year, in the future i'll prob change this to be a loop */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {transferIds.map((id) => (
              <TransferBox
                key={id}
                id={id}
                onDelete={() => {
                  {/* new section for the credits */}
                  setTransferCredits((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                  });
                  setTransferSnapshots((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                  });
                  removeGlobalTransfer(id);
                }}
                onCreditsChange={(t) =>
                  setTransferCredits((prev) => (prev[id] === t ? prev : { ...prev, [id]: t }))
                }
                onRowsChange={(boxId, rows) => setTransferSnapshots((prev) => ({ ...prev, [boxId]: rows }))}
              />
            ))}
          </div>

          {years.map((yr, idx) => (
            <div key={yr}>
              {idx > 0 && <div style={{ height: 16 }} />}
              <Year
                year={yr}
                yearCredits={yearTotals[yr]}
                onFallCreditsChange={fallSetters[yr]}
                onSpringCreditsChange={springSetters[yr]}
                hasWinter={!!additionalSemesters[`winter_${yr}`]}
                onWinterCreditsChange={getWinterSetter(yr)}
                onSummerCreditsChange={getSummerSetter(yr)}
                presets={getYearPresets(yr)}
                hasSummer={!!additionalSemesters[`summer_${yr}`]}
                onRemoveWinter={() => removeSemester("Winter", yr)}
                onRemoveSummer={() => removeSemester("Summer", yr)}
                onCourseChange={handleCourseChange}
                onSemesterSnapshot={(year, season, courses) =>
                  setSemesterSnapshots((prev) => ({ ...prev, [`${year}:${season}`]: courses }))
                }
              />
            </div>
          ))}

          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600 }}>Total credits overall: {total}</div>
          </div>
          </div>
          <RequirementsSidebar completedSet={new Set(selectedCodes.keys())} completedCounts={selectedCodes} />
        </div>
      </main>
      
      {showAddSemesterModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddSemesterModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 20,
              minWidth: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Add Winter/Summer Semester
            </h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Semester Type:
              </label>
              <select
                value={newSemesterType}
                onChange={(e) => setNewSemesterType(e.target.value as "Winter" | "Summer")}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                }}
              >
                <option value="Winter">Winter</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Year:
              </label>
              <select
                value={newSemesterYear}
                onChange={(e) => setNewSemesterYear(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                }}
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddSemesterModal(false)}
                style={{
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  padding: '6px 12px',
                  borderRadius: 4,
                }}
              >
                Cancel
              </button>
              <button
                onClick={addSemester}
                style={{
                  background: 'var(--primary, #007bff)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 4,
                }}
              >
                Add Semester
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
