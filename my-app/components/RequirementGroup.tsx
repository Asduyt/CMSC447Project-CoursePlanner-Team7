"use client";

import { useState } from "react";
import RequirementCell from "./RequirementCell";

type Course = {
  code: string;
  name?: string;
  credits?: number;
};

export default function RequirementGroup({
  title,
  courses,
  completedSet,
  completedCounts,
  showList = true,
  requiredCount,
  sameSubject,
  creditCap,
  extraCreditsForThisGroup,
}: {
  title: string;
  courses: Course[];
  completedSet?: Set<string>;
  completedCounts?: Map<string, number>;
  showList?: boolean; 
  requiredCount?: number;
  sameSubject?: boolean;
  creditCap?: number;
  extraCreditsForThisGroup?: number;
}) {
  const [open, setOpen] = useState(false);

  // normalize a course code to use as a key (remove spaces, uppercase)
  const norm = (s: string) => (s || "").replace(/\s+/g, "").toUpperCase();

  // how many times is a given code selected (from counts or set)
  const getCountFor = (code?: string) => {
    const key = norm(code || "");
    if (!key) return 0;
    const fromCounts = completedCounts?.get(key);
    if (typeof fromCounts === "number") return fromCounts;
    return completedSet?.has(key) ? 1 : 0;
  };

  // totals across the whole group
  let totals_totalCredits = 0;
  let totals_completedCredits = 0;
  let totals_completedCount = 0;
  for (const c of courses) {
    totals_totalCredits += c.credits ?? 0;
    if (getCountFor(c.code) > 0) {
      totals_completedCredits += c.credits ?? 0;
      totals_completedCount += 1;
    }
  }
  const totals_totalCount = courses.length;

  // build the list of selected courses
  const selected: Course[] = [];
  for (const c of courses) {
    const times = getCountFor(c.code);
    for (let i = 0; i < times; i++) selected.push(c);
  }

  // sum of all selected credits (counting duplicates -> for if we have like CMSC 4XX)
  let totalSelectedCreditsAll = 0;
  for (const c of courses) {
    const times = getCountFor(c.code);
    if (times > 0) totalSelectedCreditsAll += (c.credits ?? 0) * times;
  }
  // add any extra credits that should count for this group (like transfer credits for 120 total)
  if (typeof creditCap === 'number') {
    const extra = extraCreditsForThisGroup ?? 0;
    if (extra > 0) totalSelectedCreditsAll += extra;
  }

  // check which selected courses count toward this requirement
  let visibleSelected: Course[] = [];
  if (typeof creditCap === "number") {
    // include up to the credit cap
    let acc = 0;
    for (const c of selected) {
      const cr = c.credits ?? 0;
      if (acc + cr <= creditCap) {
        visibleSelected.push(c);
        acc += cr;
      }
    }
  } else if (!requiredCount || requiredCount <= 0) {
    visibleSelected = selected.slice();
  } else if (sameSubject) {
    // choose the subject with the most selected courses
    const bySubject: Record<string, Course[]> = {};
    const subjectFromCode = (code: string) => {
    const raw = String(code || "");
    const first = raw.split(" ")[0];

    if (first && /\d/.test(first) === false) return first.toUpperCase();
    
    const m = /^[A-Za-z]+/.exec(raw);

    return (m ? m[0] : "").toUpperCase();
    };
    for (const c of selected) {
      const subj = subjectFromCode(c.code || "");
      if (!bySubject[subj]) bySubject[subj] = [];
      bySubject[subj].push(c);
    }
    let best: Course[] = [];
    for (const k in bySubject) {
      if (bySubject[k].length > best.length) best = bySubject[k];
    }
    visibleSelected = best.slice(0, requiredCount);
  } else {
    visibleSelected = selected.slice(0, requiredCount);
  }

  const displayCount = requiredCount ? Math.min(visibleSelected.length, requiredCount) : totals_completedCount;
  const totalNeeded = requiredCount ?? totals_totalCount;

  const displayCompletedCredits = typeof creditCap === "number" ? Math.min(totalSelectedCreditsAll, creditCap) : totals_completedCredits;
  const displayTotalCredits = typeof creditCap === "number" ? creditCap : totals_totalCredits;

  // find percentage that's complete to display
  const percentComplete = (() => {
    let numerator = 0;
    let denominator = 0;
    if (typeof creditCap === "number") {
      numerator = displayCompletedCredits;
      denominator = displayTotalCredits || 0;
    } else {
      numerator = displayCount;
      denominator = totalNeeded || 0;
    }
    if (!denominator) return 0;
    return Math.round((numerator / denominator) * 100);
  })();

  return (
    <section>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8 }}
        role="button"
        aria-expanded={open}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h3>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12, minWidth: 0 }}>
          {/credit/i.test(title) ? (
            // for credit-based groups -> show capped credit totals and percent
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {displayCompletedCredits}/{displayTotalCredits} cr · {percentComplete}%
            </div>
          ) : (
            // for count-based groups -> show count and percent
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {displayCount}/{totalNeeded} · {percentComplete}%
            </div>
          )}
          <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▾</div>
        </div>
      </div>

      {open && (
        <div>
          {showList ? (
            // for normal groups -> if a requiredCount exists and we've reached it, only show the counted/completed courses
            (requiredCount && visibleSelected.length >= requiredCount) ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleSelected.map((c, i) => (
                  <RequirementCell key={`${c.code}-${i}`} course={c} completedSet={completedSet} />
                ))}
              </ul>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {courses.map((c) => (
                  <RequirementCell key={c.code} course={c} completedSet={completedSet} />
                ))}
              </ul>
            )
          ) : visibleSelected.length > 0 ? (
            // credit-groups in compact mode: when selections exist, render the same so styling matches other groups
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleSelected.map((c, i) => (
                <RequirementCell key={`${c.code}-${i}`} course={c} completedSet={completedSet} />
              ))}
            </ul>
          ) : (
            // otherwise show credits only (use capped display values)
            <div style={{ fontSize: 13, color: "var(--muted)", padding: "6px 2px" }}>{`${displayCompletedCredits}/${displayTotalCredits} credits`}</div>
          )}
        </div>
      )}
    </section>
  );
}
