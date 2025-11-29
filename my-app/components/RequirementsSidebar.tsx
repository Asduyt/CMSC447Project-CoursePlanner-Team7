"use client";
import courses from "@/data/courses.json";
import RequirementGroup from "./RequirementGroup";

export default function RequirementsSidebar({ completedSet, completedCounts, extraCredits }: { completedSet?: Set<string>; completedCounts?: Map<string, number>; extraCredits?: number }) {
  // build a mapping from requirement name -> courses that satisfy it
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

  // we order groups in a simple way:
  // - put credit groups first (alphabetically)
  // - make sure "120 Academic Credits" appears at the very top if present
  // - then put the rest (alphabetically)
  const allGroups = Object.keys(reqMap);
  const creditGroups = allGroups.filter((g) => /credit/i.test(g)).sort();
  const nonCreditGroups = allGroups.filter((g) => !/credit/i.test(g)).sort();
  const idx120 = creditGroups.indexOf("120 Academic Credits");
  if (idx120 > 0) {
    creditGroups.splice(idx120, 1);
    creditGroups.unshift("120 Academic Credits");
  }
  const groups = [...creditGroups, ...nonCreditGroups];

  // helper to normalize course codes so we can match them against completedSet/completedCounts
  const norm = (s: string) => (s || "").replace(/\s+/g, "").toUpperCase();
  const subjectFromCode = (code: string) => {
    const raw = String(code || "");
    // Prefer split-on-space for backwards compatibility
    const first = raw.split(" ")[0];
    if (first && /[\d]/.test(first) === false) return first.toUpperCase();
    // Fallback: take leading letters
    const m = /^[A-Za-z]+/.exec(raw);
    return (m ? m[0] : "").toUpperCase();
  };

  // helper to get count of completions for a given course code
  const getCountFor = (code?: string) => {
    const key = norm(code || "");
    if (!key) return 0;
    const fromCounts = completedCounts?.get(key);
    if (typeof fromCounts === "number") return fromCounts;
    return completedSet?.has(key) ? 1 : 0;
  };

  // helper to get group configuration
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

  // get the overall completion percentage
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
        // add extra transfer credits only for the 120 Academic Credits group
        if (/^120 Academic Credits$/i.test(group) && typeof extraCredits === 'number') {
          sum += extraCredits;
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
            const subj = subjectFromCode(c.code || '');
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
        Linked to planner selections. Items are checked automatically.
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
    const is120 = /^120 Academic Credits$/i.test(group);
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
              extraCreditsForThisGroup={is120 ? (extraCredits ?? 0) : 0}
            />
          </div>
        );
      })}
    </aside>
  );
}

