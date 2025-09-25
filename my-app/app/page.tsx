"use client";

import { useMemo, useState } from "react";
import Cell from "@/components/Cell";
import ThemeToggle from "@/components/ThemeToggle";
import Semester from "@/components/Semester";

export default function Home() {
  const [resetCount, setResetCount] = useState(0);
  
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year 1</h2>
            <div>Year credits: {y1}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Semester season="Fall" year={1} onCreditsChange={setY1Fall} />
            <Semester season="Spring" year={1} onCreditsChange={setY1Spring} />
          </div>

          {/* Year 2 */}
          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year 2</h2>
            <div>Year credits: {y2}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Semester season="Fall" year={2} onCreditsChange={setY2Fall} />
            <Semester season="Spring" year={2} onCreditsChange={setY2Spring} />
          </div>

          {/* Year 3 */}
          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year 3</h2>
            <div>Year credits: {y3}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Semester season="Fall" year={3} onCreditsChange={setY3Fall} />
            <Semester season="Spring" year={3} onCreditsChange={setY3Spring} />
          </div>

          {/* Year 4 */}
          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year 4</h2>
            <div>Year credits: {y4}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Semester season="Fall" year={4} onCreditsChange={setY4Fall} />
            <Semester season="Spring" year={4} onCreditsChange={setY4Spring} />
          </div>

          <div style={{ height: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600 }}>Total credits overall: {total}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
