"use client";
// One requirement group (like Science, Arts and Humanities, etc.)
// Shows progress and lets you expand to see courses.
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
}: {
  title: string;
  courses: Course[];
  completedSet?: Set<string>;
  completedCounts?: Map<string, number>;
  showList?: boolean; 
  requiredCount?: number;
  sameSubject?: boolean;
  creditCap?: number;
}) {
  const [open, setOpen] = useState(false);

  // turn a course code into a simple key (remove spaces, uppercase)
  const norm = (s: string) => (s || "").replace(/\s+/g, "").toUpperCase();

  // how many times was this code picked (duplicates count for electives)
  const getCountFor = (code?: string) => {
    const key = norm(code || "");
    if (!key) return 0;
    const fromCounts = completedCounts?.get(key);
    if (typeof fromCounts === "number") return fromCounts;
    return completedSet?.has(key) ? 1 : 0;
  };

  // totals for all courses in the group
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

  // build list of selected courses with duplicates expanded
  const selected: Course[] = [];
  for (const c of courses) {
    const times = getCountFor(c.code);
    for (let i = 0; i < times; i++) selected.push(c);
  }

  // sum of all selected credits (duplicates count)
  let totalSelectedCreditsAll = 0;
  for (const c of courses) {
    const times = getCountFor(c.code);
    if (times > 0) totalSelectedCreditsAll += (c.credits ?? 0) * times;
  }

  // figure out which selected courses actually count toward completion
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
    for (const c of selected) {
      const subj = (c.code || "").split(" ")[0] || "";
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

  // number of counted courses (limited by requiredCount if present)
  const displayCount = requiredCount ? Math.min(visibleSelected.length, requiredCount) : totals_completedCount;
  const totalNeeded = requiredCount ?? totals_totalCount;

  // credits counted (capped if credit group)
  const displayCompletedCredits = typeof creditCap === "number" ? Math.min(totalSelectedCreditsAll, creditCap) : totals_completedCredits;
  const displayTotalCredits = typeof creditCap === "number" ? creditCap : totals_totalCredits;

  // percentage complete for group
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
            // for normal groups, if a requiredCount exists and we've reached it, only show the counted/completed courses
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
