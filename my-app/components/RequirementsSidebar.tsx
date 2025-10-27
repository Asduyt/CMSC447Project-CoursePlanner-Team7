"use client";

import courses from "@/data/courses.json";
import RequirementGroup from "./RequirementGroup";

type Requirement = {
  code: string;
  label?: string;
};

const DEFAULT_REQUIREMENTS: Requirement[] = [
  { code: "CMSC 201" },
  { code: "CMSC 202" },
  { code: "CMSC 203" },
  { code: "MATH 151" },
];

export default function RequirementsSidebar({ requirements = DEFAULT_REQUIREMENTS, completedSet }: { requirements?: Requirement[]; completedSet?: Set<string> }) {
  // Build a mapping from requirement name -> courses that satisfy it
  const reqMap: Record<string, any[]> = {};
  courses.forEach((c: any) => {
    if (!Array.isArray(c.requirements)) return;
    c.requirements.forEach((r: string) => {
      const key = (r || "").trim();
      if (!key) return;
      if (!reqMap[key]) reqMap[key] = [];
      reqMap[key].push(c);
    });
  });

  // Order groups:
  // 1) credit-based groups at the top (case-insensitive), with "120 Academic Credits" first
  // 2) within credit groups, sort alphabetically
  // 3) then the remaining groups alphabetically
  const groups = Object.keys(reqMap).sort((a, b) => {
    const aIs120 = a === "120 Academic Credits";
    const bIs120 = b === "120 Academic Credits";
    if (aIs120 && !bIs120) return -1;
    if (bIs120 && !aIs120) return 1;

    const aIsCredit = /credit/i.test(a);
    const bIsCredit = /credit/i.test(b);
    if (aIsCredit && !bIsCredit) return -1;
    if (bIsCredit && !aIsCredit) return 1;

    // Both credit or both non-credit: alphabetical
    return a.localeCompare(b);
  });

  return (
    <aside
      style={{
        background: "var(--surface)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 16,
        width: 380,
        position: "sticky",
        top: 16,
        maxHeight: '80vh',
        overflowY: 'auto',
        scrollbarGutter: 'stable',
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>Degree Requirements</h2>
      <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, opacity: 0.8 }}>
        Linked to planner selections. Items are checked automatically.
      </p>

      {groups.map((group) => {
  // per-group hard-coded requirements
  const cfg: { requiredCount?: number; sameSubject?: boolean; creditCap?: number } = {};
        if (/^Arts and Humanities$/i.test(group)) cfg.requiredCount = 3;
        if (/Computer Science Elective/i.test(group)) cfg.requiredCount = 2;
        if (/Computer Science Technical Electives/i.test(group)) cfg.requiredCount = 3;
        if (/^Science$/i.test(group)) {
          cfg.requiredCount = 2;
          cfg.sameSubject = true;
        }
        // credit caps
        if (/^120 Academic Credits$/i.test(group)) cfg.creditCap = 120;
        if (/45 upper level credits/i.test(group)) cfg.creditCap = 45;
        if (/^Science Lab$/i.test(group)) cfg.requiredCount = 1;
        if (/English Composition/i.test(group)) cfg.requiredCount = 1;

        return (
          <div key={group} style={{ marginBottom: 12 }}>
            <RequirementGroup
              title={group}
              courses={reqMap[group]}
              completedSet={completedSet}
              // treat any requirement whose name mentions 'credit' as a credit-group (compact view)
              showList={!/credit/i.test(group)}
              requiredCount={cfg.requiredCount}
              sameSubject={cfg.sameSubject}
              creditCap={cfg.creditCap}
            />
          </div>
        );
      })}
    </aside>
  );
}

