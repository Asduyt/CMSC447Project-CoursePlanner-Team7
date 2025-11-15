"use client";
// Sidebar that shows progress on all degree requirements.
// It reads the course catalog and the selected course codes from the planner.
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

export default function RequirementsSidebar({ requirements = DEFAULT_REQUIREMENTS, completedSet, completedCounts }: { requirements?: Requirement[]; completedSet?: Set<string>; completedCounts?: Map<string, number> }) {
  // build a map from requirement name to list of courses that satisfy it
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

  // order groups: credit groups first, then others. Put 120 credits at very top.
  const allGroups = Object.keys(reqMap);
  const creditGroups = allGroups.filter((g) => /credit/i.test(g)).sort();
  const nonCreditGroups = allGroups.filter((g) => !/credit/i.test(g)).sort();
  const idx120 = creditGroups.indexOf("120 Academic Credits");
  if (idx120 > 0) {
    creditGroups.splice(idx120, 1);
    creditGroups.unshift("120 Academic Credits");
  }
  const groups = [...creditGroups, ...nonCreditGroups];

  // helper: normalize a course code (remove spaces + uppercase)
  const norm = (s: string) => (s || "").replace(/\s+/g, "").toUpperCase();

  // how many times a code was selected (duplicate electives count)
  const getCountFor = (code?: string) => {
    const key = norm(code || "");
    if (!key) return 0;
    const fromCounts = completedCounts?.get(key);
    if (typeof fromCounts === "number") return fromCounts;
    return completedSet?.has(key) ? 1 : 0;
  };

  // helper to get group configuration
  // figure out rules for a group (how many needed, credit caps, same subject rule)
  const getGroupConfig = (name: string) => {
    const cfg: { requiredCount?: number; sameSubject?: boolean; creditCap?: number } = {};
    if (/^Arts and Humanities$/i.test(name)) cfg.requiredCount = 3;
    if (/Computer Science Elective/i.test(name)) cfg.requiredCount = 2;
    if (/Computer Science Technical Electives/i.test(name)) cfg.requiredCount = 3;
    if (/^Science$/i.test(name)) {
      cfg.requiredCount = 2;
      cfg.sameSubject = true;
    }
    if (/^Science Lab$/i.test(name)) cfg.requiredCount = 1;
    if (/English Composition/i.test(name)) cfg.requiredCount = 1;
    if (/^120 Academic Credits$/i.test(name)) cfg.creditCap = 120;
    if (/45 upper level credits/i.test(name)) cfg.creditCap = 45;
    return cfg;
  };

  // overall completion percentage across all groups
  const overallPercent = (() => {
    let num = 0;
    let den = 0;

    for (const group of groups) {
      const list = reqMap[group] as Array<{ code: string; credits?: number }>;
      const cfg = getGroupConfig(group);

      if (typeof cfg.creditCap === "number") {
        let sum = 0;
        for (const c of list) {
          const count = getCountFor(c.code);
          if (count > 0) sum += (c.credits ?? 0) * count;
        }
        num += Math.min(sum, cfg.creditCap);
        den += cfg.creditCap;
        continue;
      }

      if (typeof cfg.requiredCount === "number" && cfg.requiredCount > 0) {
        // count selections for this group (with duplicates)
        const selected: Array<{ code: string; credits?: number }> = [];
        for (const c of list) {
          const count = getCountFor(c.code);
          for (let i = 0; i < count; i++) selected.push(c);
        }

        let groupNumerator = 0;
        if (cfg.sameSubject) {
          const bySubject: Record<string, number> = {};
          for (const c of selected) {
            const subj = (c.code || '').split(' ')[0] || '';
            bySubject[subj] = (bySubject[subj] ?? 0) + 1;
          }
          let best = 0;
          for (const k in bySubject) best = Math.max(best, bySubject[k]);
          groupNumerator = Math.min(best, cfg.requiredCount);
        } else {
          groupNumerator = Math.min(selected.length, cfg.requiredCount);
        }

        num += groupNumerator;
        den += cfg.requiredCount;
        continue;
      }
    }

    if (den === 0) return 0;
    return Math.round((num / den) * 100);
  })();

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
        Automatically updates when you pick courses.
      </p>
      {/* overall completion percentage across requirements */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Overall completion</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{overallPercent}%</div>
      </div>

  {groups.map((group) => {
        const cfg = getGroupConfig(group);
        return (
          <div key={group} style={{ marginBottom: 12 }}>
            <RequirementGroup
              title={group}
              courses={reqMap[group]}
              completedSet={completedSet}
              completedCounts={completedCounts}
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

