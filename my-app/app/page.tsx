"use client";

import { useMemo, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Year from "@/components/Year";
import TransferBox from "@/components/TransferBox";
import RequirementsSidebar from "@/components/RequirementsSidebar";
import courses from "@/data/courses.json";
import { computeRequirementsSummary } from "@/lib/requirementsSummary";

export default function Home() {
  const [resetCount, setResetCount] = useState(0);
  const [showTransfers, setShowTransfers] = useState<number[]>([]);
  const [prefillOn, setPrefillOn] = useState(false);
  // snapshot storage for export
  const [semesterSnapshots, setSemesterSnapshots] = useState<Record<string, { code: string; name: string; credits: number; grade?: string | null }[]>>({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // State for additional Winter/Summer semesters
  const [additionalSemesters, setAdditionalSemesters] = useState<{[key: string]: boolean;}>({});

  // Modal state for adding Winter/Summer semester
  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false);
  const [newSemesterType, setNewSemesterType] = useState<"Winter" | "Summer">("Winter");
  const [newSemesterYear, setNewSemesterYear] = useState(1);

  const addGlobalTransfer = () => {
    setShowTransfers((prev) => [...prev, (prev.at(-1) ?? -1) + 1]);
  };
  const removeGlobalTransfer = (id: number) => {
    setShowTransfers((prev) => prev.filter((x) => x !== id));
  };
  // track credits for transfer boxes by id
  const [transferCredits, setTransferCredits] = useState<Record<number, number>>({});
  const totalTransferCredits = useMemo(() => Object.values(transferCredits).reduce((a, b) => a + b, 0), [transferCredits]);
  // track the actual rows of transfer items for requirement matching & credits
  const [transferRowsByBox, setTransferRowsByBox] = useState<Record<number, { code: string; credits: number; transferFrom?: string }[]>>({});
  // compute extra transfer credits that don't map to a known catalog course (so they still count toward 120)
  const unmatchedTransferCredits = useMemo(() => {
    const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();
    const catalog = new Set<string>();
    for (let i = 0; i < (courses as any[]).length; i++) {
      const c = (courses as any[])[i];
      if (c && c.code) catalog.add(norm(String(c.code)));
    }
    // sum up credits for transfer rows that don't match any catalog course
    let sum = 0;
    for (const key in transferRowsByBox) {
      const list = transferRowsByBox[key] || [];
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const codeKey = norm(String(row.code));
        if (!catalog.has(codeKey)) sum += row.credits || 0;
      }
    }
    return sum;
  }, [transferRowsByBox]);

  // deduplicated counts for transfer courses: if multiple transfer rows map to the same UMBC code,
  // only count that code once toward requirements. credits for unmatched courses still sum into 120.
  const transferCounts = useMemo(() => {
    const map = new Map<string, number>();
    const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();
    const seen = new Set<string>();
    for (const key in transferRowsByBox) {
      const list = transferRowsByBox[key] || [];
      for (const row of list) {
        const k = norm(String(row.code || ""));
        if (!k) continue;
        if (!seen.has(k)) {
          map.set(k, 1);
          seen.add(k);
        }
      }
    }
    return map;
  }, [transferRowsByBox]);
  
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
  // keep semester selections separate from transfer selections
  const [semesterCounts, setSemesterCounts] = useState<Map<string, number>>(new Map());

  // Combine semester and transfer counts for the requirements sidebar
  const combinedCounts = useMemo(() => {
    const map = new Map(semesterCounts);
    transferCounts.forEach((n, k) => map.set(k, (map.get(k) ?? 0) + n));
    return map;
  }, [semesterCounts, transferCounts]);

  const handleCourseChange = (prevCode: string | null, nextCode: string | null) => {
    setSemesterCounts((prev) => {
      const map = new Map(prev);
      const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();
      if (prevCode) {
        const p = norm(prevCode);
        const count = (map.get(p) ?? 0) - 1;
        if (count <= 0) map.delete(p); else map.set(p, count);
      }
      if (nextCode) {
        const n = norm(nextCode);
        map.set(n, (map.get(n) ?? 0) + 1);
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
        fall: ["CMSC201", "MATH151", "LANG201", "ENGL GEP"],
        spring: ["CMSC202", "MATH152", "CMSC203", "AH GEP", "SS GEP"],
      };
    }
    if (year === 2) {
      return {
        fall: ["CMSC331", "CMSC341", "SCI SEQ I", "SS GEP", "ELECTIVE"],
        spring: ["CMSC313", "MATH221", "SCI SEQ II", "SCI LAB GEP", "SS GEP"],
      };
    }
    if (year === 3) {
      return {
        fall: ["CMSC304", "CMSC411", "CMSC4XX - TEC", "STAT355"],
        spring: ["CMSC421", "CMSC4XX - CS", "CMSC4XX - TEC", "AH GEP", "C GEP"],
      };
    }
    return {
      fall: ["CMSC441", "CMSC447", "UL ELECT", "ELECTIVE", "ELECTIVE"],
      spring: ["CMSC4XX - CS", "CMSC4XX - TEC", "ELECTIVE", "ELECTIVE", "ELECTIVE"],
    };
  };

  const clearSchedule = () => {
    // reset transfers and optional semesters
    setShowTransfers([]);
    setTransferCredits({});
    setSemesterSnapshots({});
    setAdditionalSemesters({});
    // reset selections
  setSemesterCounts(new Map());
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

  // EXPORT HELPERS (simple and readable)
  // Try to load an image from public/ and return a data URL + its natural size
  function loadImageData(src: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = src;
      } catch {
        resolve(null);
      }
    });
  }

  function exportCSV() {
    // simple table only; include a small CSV header row with a human-readable title
    // CSV cannot embed images, so we put a text header that appears above the table
    // CSV header for planned courses: use full 'Credits' label
    const rows: string[][] = [["UMBC College of Engineering and Information Technology"], [], ["Type","Year","Semester","Code","Name","Credits","Grade","Transfer From"]];
    // planned courses by semester
    const orderSeasons = ["Fall","Winter","Spring","Summer"];
    const keys = Object.keys(semesterSnapshots)
      .map((k)=>{ const [yStr, s] = k.split(":"); return { key:k, year: parseInt(yStr,10), season: s }; })
      .sort((a,b)=> (a.year - b.year) || (orderSeasons.indexOf(a.season) - orderSeasons.indexOf(b.season)));
    for (const { key, year, season } of keys) {
      for (const c of semesterSnapshots[key] || []) {
        const type = (c as any).grade ? 'completed' : 'planned';
        rows.push([type, String(year), season, c.code, c.name, String(c.credits), (c as any).grade ?? "", ""]);
      }
    }
    // transfer rows (built from what TransferBox gives parent)
    for (const boxId in transferRowsByBox) {
      const list = (transferRowsByBox as any)[boxId] || [];
      for (const r of list) {
        const code = (r.code ?? r.course ?? "");
        const credits = (typeof r.credits === 'number') ? r.credits : parseFloat((r as any).credits || '0') || 0;
        const from = (r as any).transferFrom || "";
        const type = 'completed'; // transfer classes treated as completed by definition
        // keep 8 columns: Type, Year, Semester, Code, Name, Credits, Grade, Transfer From
        rows.push([type, "", "", String(code), String(code), String(credits), (r as any).grade ?? "", String(from)]);
      }
    }
    // requirements section — ensure each requirement row has the same number of columns (8)
    rows.push([]);
    rows.push(["Requirements Summary"]);
    // requirement header aligned to the main table (put labels starting at the 4th column)
    // leave the 'Type' header blank here so the requirements section doesn't show a type label
    rows.push(["", "", "", "REQUIREMENT NAME", "PROGRESS", "", "COMPLETED", "COUNTED COURSES"]);
    // include unmatched transfer credits when computing requirement summaries
    const reqSummary = computeRequirementsSummary(combinedCounts, unmatchedTransferCredits);
    for (const r of reqSummary) {
      const progress = r.type === 'credit' ? `${r.completed}/${r.total} cr (${r.percent}%)` : `${r.completed}/${r.total} (${r.percent}%)`;
      const counted = r.countedCourseCodes.join('; ');
      // keep row length at 8 columns so spreadsheet column widths align predictably
      // leave the 'Type' column empty for the requirements summary per request
      rows.push(["", "", "", r.name, progress, "", String(r.completed), counted]);
    }
    const csv = rows.map(r => r.map(v => `"${(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'planner.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    // We'll place the logo at the top-right and make it a bit larger.
    let y = 10;
    const logo = await loadImageData('/umbc-logo.png');
    if (logo) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      // target height (in PDF units) to make the logo bigger than before
      const targetH = 24; // larger than previous 16
      const scale = targetH / Math.max(1, logo.height);
      const w = Math.max(1, logo.width * scale);
      const h = Math.max(1, logo.height * scale);
      // place at right edge: x = pageWidth - margin - w
      const x = Math.max(margin, pageWidth - margin - w);

      // Text to the left of the logo (vertically centered with the logo)
      const titleText = 'UMBC College of Engineering and Information Technology';
      // larger bold font for the header title next to the logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      // Compute the maximum width available for the text before the logo
      const maxTextWidth = Math.max(20, x - margin - 8);
      const titleLines = doc.splitTextToSize(titleText, maxTextWidth);
      // draw lines vertically centered relative to the logo box
      const lineHeight = 6; // line height adjusted for larger font
      let textStartY = y + Math.max(0, (h - titleLines.length * lineHeight) / 2) + lineHeight;
      for (const line of titleLines) {
        doc.text(line, margin, textStartY);
        textStartY += lineHeight;
      }

      // add the logo on the right
      doc.addImage(logo.dataUrl, 'PNG', x, y, w, h);
      // switch back to normal for the rest of the document
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      // keep y below the logo for following content
      y += h + 6;
    } else {
      // Fallback title if image not present
      doc.setFontSize(14);
      doc.text('UMBC — College of Engineering and Information Technology', 10, y);
      y += 8;
    }
    doc.setFontSize(11);
    const orderSeasons = ["Fall","Winter","Spring","Summer"];
    const keys = Object.keys(semesterSnapshots)
      .map((k)=>{ const [yStr, s] = k.split(":"); return { key:k, year: parseInt(yStr,10), season: s }; })
      .sort((a,b)=> (a.year - b.year) || (orderSeasons.indexOf(a.season) - orderSeasons.indexOf(b.season)));
    for (const { key, year, season } of keys) {
      doc.setFont('helvetica','bold');
      doc.text(`Year ${year} - ${season}`,10,y);
      doc.setFont('helvetica','normal');
      y+=6;
      for (const c of semesterSnapshots[key] || []) {
        const gradeText = c.grade ? ` — Grade: ${c.grade}` : '';
        doc.text(`- ${c.code} ${c.name} (${c.credits} cr)${gradeText}`,14,y);
        y+=6; if (y>280){ doc.addPage(); y=10; doc.setFontSize(11);} 
      }
      y+=4; if (y>280){ doc.addPage(); y=10; doc.setFontSize(11);} }
  doc.setFont('helvetica','bold');
  doc.text('Transfers',10,y); y+=6;
  doc.setFont('helvetica','normal');
    for (const boxId in transferRowsByBox) {
      const list = (transferRowsByBox as any)[boxId] || [];
      for (const r of list) {
        const code = (r.code ?? r.course ?? "");
        const credits = (typeof r.credits === 'number') ? r.credits : parseFloat((r as any).credits || '0') || 0;
        const from = (r as any).transferFrom ? ` — from ${(r as any).transferFrom}` : '';
        doc.text(`- ${String(code)} (${credits} cr)${from}`,14,y); y+=6; if (y>280){ doc.addPage(); y=10; doc.setFontSize(11);} }
    }
    if (y>260){ doc.addPage(); y=10; }
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.text('Requirements',10,y); y+=6; doc.setFontSize(10); doc.setFont('helvetica','normal');
    const reqSummary = computeRequirementsSummary(combinedCounts, unmatchedTransferCredits);
    for (const r of reqSummary) {
      const progress = r.type === 'credit' ? `${r.completed}/${r.total} cr (${r.percent}%)` : `${r.completed}/${r.total} (${r.percent}%)`;
      doc.setFont('helvetica','bold');
      const header = doc.splitTextToSize(`${r.name}: ${progress}`, 190);
      for (const part of header) { doc.text(part,12,y); y+=5; if (y>280){ doc.addPage(); y=10; doc.setFontSize(10);} }
      doc.setFont('helvetica','normal');
      if (r.countedCourseCodes.length) {
        const counted = doc.splitTextToSize(`Counted: ${r.countedCourseCodes.join(', ')}`, 186);
        for (const part of counted) { doc.text(part,14,y); y+=5; if (y>280){ doc.addPage(); y=10; doc.setFontSize(10);} }
      }
      y+=2; if (y>280){ doc.addPage(); y=10; doc.setFontSize(10);} }
    doc.save('planner.pdf');
  }
  
  return (
    // the main page layout
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <header className="row-start-1 w-full flex justify-center">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* header bar with the title + theme toggle */}
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>UMBC COEIT Course Planner</h1>
          <ThemeToggle />
          {/* prefill button that allows you to prefill the planner with suggested courses from the pathways website */}
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
              {/* Global Transfer button (adds a transfer box above Year 1) */}
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
              
              {/* Add Winter/Summer Semester button */}
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
              {/* Export menu next to + Winter/Summer */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  onClick={() => setShowExportMenu((v) => !v)}
                  style={{
                    background: "var(--surface)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Export
                </button>
                {showExportMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      background: 'var(--surface)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      minWidth: 160,
                      zIndex: 1000,
                    }}
                    onMouseLeave={() => setShowExportMenu(false)}
                  >
                    <button
                      onClick={() => { setShowExportMenu(false); exportCSV(); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'transparent',
                        color: 'inherit',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Download CSV
                    </button>
                    <button
                      onClick={async () => { setShowExportMenu(false); await exportPDF(); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'transparent',
                        color: 'inherit',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Download PDF
                    </button>
                  </div>
                )}
              </div>
          
        </div>
      </header>
      {/* all the semesters layout page */}
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
    {showTransfers.map((id) => (
              <TransferBox
                key={id}
                onDelete={() => {
                  {/* new section for the credits */}
                  setTransferCredits((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                  });
                  // remove transfer rows tracking for this box
                  setTransferRowsByBox((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                  });
                  removeGlobalTransfer(id);
                }}
                onCreditsChange={(t) =>
                  setTransferCredits((prev) => (prev[id] === t ? prev : { ...prev, [id]: t }))
                }
                onRowsChange={(rows) => {
                // update transfer rows for this box
                setTransferRowsByBox((prev) => ({ ...prev, [id]: rows }));
                }}
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
                onSemesterSnapshot={(year, season, list) => setSemesterSnapshots((prev) => ({ ...prev, [`${year}:${season}`]: list }))}
              />
            </div>
          ))}

          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600 }}>Total credits overall: {total}</div>
          </div>
          </div>
          <RequirementsSidebar completedSet={new Set(combinedCounts.keys())} completedCounts={combinedCounts} extraCredits={unmatchedTransferCredits} />
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
