"use client";

import { useMemo, useState } from "react";
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
  showList = true,
  requiredCount,
  sameSubject,
  creditCap,
}: {
  title: string;
  courses: Course[];
  completedSet?: Set<string>;
  showList?: boolean; // when false, show compact summary instead of full list
  requiredCount?: number;
  sameSubject?: boolean;
  creditCap?: number;
}) {
  const [open, setOpen] = useState(false);

  const totals = useMemo(() => {
    const totalCredits = courses.reduce((s, c) => s + (c.credits ?? 0), 0);
    const completedCredits = courses.reduce((s, c) => {
      const key = (c.code || "").replace(/\s+/g, "").toUpperCase();
      return s + ((completedSet?.has(key) ?? false) ? (c.credits ?? 0) : 0);
    }, 0);
    const totalCount = courses.length;
    const completedCount = courses.reduce((s, c) => {
      const key = (c.code || "").replace(/\s+/g, "").toUpperCase();
      return s + ((completedSet?.has(key) ?? false) ? 1 : 0);
    }, 0);
    return { totalCredits, completedCredits, totalCount, completedCount };
  }, [courses, completedSet]);

  // list of selected courses (raw)
  const selected = useMemo(() => {
    return courses.filter((c) => {
      const key = (c.code || "").replace(/\s+/g, "").toUpperCase();
      return !!completedSet?.has(key);
    });
  }, [courses, completedSet]);

  // determine which selected courses should count toward the requirement
  const visibleSelected = useMemo(() => {
    // If a credit cap is provided, include selected courses until the credit cap would be exceeded.
    if (typeof creditCap === "number") {
      const included: Course[] = [];
      let acc = 0;
      // use the order of `selected` (which follows the courses array) to pick courses
      for (const c of selected) {
        const cr = c.credits ?? 0;
        if (acc + cr <= creditCap) {
          included.push(c);
          acc += cr;
        }
      }
      return included;
    }

    if (!requiredCount || requiredCount <= 0) return selected.slice();

    if (sameSubject) {
      // group selected by subject prefix (before first space)
      const bySubject: Record<string, Course[]> = {};
      for (const c of selected) {
        const subj = (c.code || "").split(" ")[0] || "";
        if (!bySubject[subj]) bySubject[subj] = [];
        bySubject[subj].push(c);
      }
      // find the subject with the most selected courses
      let best: Course[] = [];
      for (const k of Object.keys(bySubject)) {
        if (bySubject[k].length > best.length) best = bySubject[k];
      }
      if (best.length >= requiredCount) return best.slice(0, requiredCount);
      return [];
    }

    // otherwise, just take up to requiredCount selected courses (first ones)
    return selected.slice(0, requiredCount);
  }, [selected, requiredCount, sameSubject]);

  const displayCount = requiredCount ? Math.min(visibleSelected.length, requiredCount) : totals.completedCount;
  const totalNeeded = requiredCount ?? totals.totalCount;

  const sumVisibleCredits = visibleSelected.reduce<number>((s, c) => s + (c.credits ?? 0), 0);
  const displayCompletedCredits = typeof creditCap === "number" ? Math.min(sumVisibleCredits, creditCap) : totals.completedCredits;
  const displayTotalCredits = typeof creditCap === "number" ? creditCap : totals.totalCredits;

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
            // For credit-based groups: always show credit totals in the collapsed/header area (capped)
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{displayCompletedCredits}/{displayTotalCredits} cr</div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{displayCount}/{totalNeeded}</div>
          )}
          <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▾</div>
        </div>
      </div>

      {open && (
        <div>
          {showList ? (
            // For normal groups: if a requiredCount exists and we've reached it, only show the counted/completed courses.
            (requiredCount && visibleSelected.length >= requiredCount) ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleSelected.map((c) => (
                  <RequirementCell key={c.code} course={c} completedSet={completedSet} />
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
            // credit-groups in compact mode: when selections exist, render the same UL of RequirementCell so styling matches other groups
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleSelected.map((c) => (
                <RequirementCell key={c.code} course={c} completedSet={completedSet} />
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
