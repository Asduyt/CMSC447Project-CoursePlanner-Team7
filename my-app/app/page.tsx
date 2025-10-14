"use client";

import { useMemo, useState } from "react";
import Cell from "@/components/cell";
import ThemeToggle from "@/components/ThemeToggle";
import Semester from "@/components/Semester";
import TransferBox from "@/components/TransferBox";

export default function Home() {
  const [resetCount, setResetCount] = useState(0);
  const [showTransfers, setShowTransfers] = useState<number[]>([]);
  
  // State for additional Winter/Summer semesters
  const [additionalSemesters, setAdditionalSemesters] = useState<{
    [key: string]: boolean; 
  }>({});
  
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
  };
  
  // track credits for each semester to help us show it
  const [y1Fall, setY1Fall] = useState(0);
  const [y1Spring, setY1Spring] = useState(0);
  const [y2Fall, setY2Fall] = useState(0);
  const [y2Spring, setY2Spring] = useState(0);
  const [y3Fall, setY3Fall] = useState(0);
  const [y3Spring, setY3Spring] = useState(0);
  const [y4Fall, setY4Fall] = useState(0);
  const [y4Spring, setY4Spring] = useState(0);

  const y1 = y1Fall + y1Spring;
  const y2 = y2Fall + y2Spring;
  const y3 = y3Fall + y3Spring;
  const y4 = y4Fall + y4Spring;
  const total = y1 + y2 + y3 + y4;
  
  return (
    // the main page layout
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <header className="row-start-1 w-full flex justify-center">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* header bar with the title + theme toggle */}
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>UMBC COEIT Course Planner</h1>
          <ThemeToggle />
          <button
            onClick={() => setResetCount((n) => n + 1)}
            style={{
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              padding: "6px 10px",
              borderRadius: 6,
            }}
          >
            Clear Schedule
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
          
        </div>
      </header>
      {/* all the semesters layout page */}
      {/* NEED TO ADD -> option to add winter/summer semesters */}
      <main className="row-start-2 w-full flex justify-center">
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
          {/* Transfer Classes section (standalone above Year 1) */}
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Transfer Classes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {showTransfers.map((id) => (
              <TransferBox key={id} onDelete={() => removeGlobalTransfer(id)} />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year 1</h2>
            <div>Year credits: {y1}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Semester season="Fall" year={1} onCreditsChange={setY1Fall} />
            {additionalSemesters[`winter_1`] && (
              <Semester season="Winter" year={1} onCreditsChange={() => {}} onDelete={() => removeSemester("Winter", 1)} />
            )}
            <Semester season="Spring" year={1} onCreditsChange={setY1Spring} />
            {additionalSemesters[`summer_1`] && (
              <Semester season="Summer" year={1} onCreditsChange={() => {}} onDelete={() => removeSemester("Summer", 1)} />
            )}
          </div>

          {/* Year 2 */}
          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year 2</h2>
            <div>Year credits: {y2}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Semester season="Fall" year={2} onCreditsChange={setY2Fall} />
            {additionalSemesters[`winter_2`] && (
              <Semester season="Winter" year={2} onCreditsChange={() => {}} onDelete={() => removeSemester("Winter", 2)} />
            )}
            <Semester season="Spring" year={2} onCreditsChange={setY2Spring} />
            {additionalSemesters[`summer_2`] && (
              <Semester season="Summer" year={2} onCreditsChange={() => {}} onDelete={() => removeSemester("Summer", 2)} />
            )}
          </div>

          {/* Year 3 */}
          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year 3</h2>
            <div>Year credits: {y3}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Semester season="Fall" year={3} onCreditsChange={setY3Fall} />
            {additionalSemesters[`winter_3`] && (
              <Semester season="Winter" year={3} onCreditsChange={() => {}} onDelete={() => removeSemester("Winter", 3)} />
            )}
            <Semester season="Spring" year={3} onCreditsChange={setY3Spring} />
            {additionalSemesters[`summer_3`] && (
              <Semester season="Summer" year={3} onCreditsChange={() => {}} onDelete={() => removeSemester("Summer", 3)} />
            )}
          </div>

          {/* Year 4 */}
          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year 4</h2>
            <div>Year credits: {y4}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Semester season="Fall" year={4} onCreditsChange={setY4Fall} />
            {additionalSemesters[`winter_4`] && (
              <Semester season="Winter" year={4} onCreditsChange={() => {}} onDelete={() => removeSemester("Winter", 4)} />
            )}
            <Semester season="Spring" year={4} onCreditsChange={setY4Spring} />
            {additionalSemesters[`summer_4`] && (
              <Semester season="Summer" year={4} onCreditsChange={() => {}} onDelete={() => removeSemester("Summer", 4)} />
            )}
          </div>

          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600 }}>Total credits overall: {total}</div>
          </div>
        </div>
      </main>
      
      {/* Add Winter/Summer Semester Modal */}
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
