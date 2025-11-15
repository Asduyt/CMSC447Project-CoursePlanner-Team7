// This helper builds a summary of requirement progress.
// It is used when exporting CSV/PDF.
import catalog from "@/data/courses.json";

export type RequirementSummary = {
  name: string;              // requirement group name
  type: "credit" | "count"; // how we measure progress
  percent: number;           // percent complete (0-100)
  completed: number;         // credits earned OR count so far
  total: number;             // credit cap OR needed count
  countedCourseCodes: string[];      // courses that actually count (respect caps and limits)
  rawSelectedCourseCodes: string[];  // every selected course (duplicates expanded)
};

// Mirror logic from RequirementsSidebar / RequirementGroup for ordering + config
// figure out special rules for a requirement name
function getGroupConfig(name: string) {
  const cfg: { requiredCount?: number; sameSubject?: boolean; creditCap?: number } = {};
  if (/^Arts and Humanities$/i.test(name)) cfg.requiredCount = 3;
  if (/Computer Science Elective/i.test(name)) cfg.requiredCount = 2;
  if (/Computer Science Technical Electives/i.test(name)) cfg.requiredCount = 3;
  if (/^Science$/i.test(name)) { cfg.requiredCount = 2; cfg.sameSubject = true; }
  if (/^Science Lab$/i.test(name)) cfg.requiredCount = 1;
  if (/English Composition/i.test(name)) cfg.requiredCount = 1;
  if (/^120 Academic Credits$/i.test(name)) cfg.creditCap = 120;
  if (/45 upper level credits/i.test(name)) cfg.creditCap = 45;
  return cfg;
}

// normalize codes by removing spaces and uppercasing
const norm = (s: string) => (s || "").replace(/\s+/g, "").toUpperCase();

// Build summaries given a map of code -> count selected
export function computeRequirementsSummary(selectedCounts: Map<string, number>): RequirementSummary[] {
  // Build requirement name -> courses list
  const reqMap: Record<string, any[]> = {};
  (catalog as any[]).forEach((c) => {
    if (!Array.isArray(c.requirements)) return;
    c.requirements.forEach((r: string) => {
      const key = (r || "").trim();
      if (!key) return;
      if (!reqMap[key]) reqMap[key] = [];
      reqMap[key].push(c);
    });
  });

  const allGroups = Object.keys(reqMap); // all requirement names
  const creditGroups = allGroups.filter((g) => /credit/i.test(g)).sort();
  const nonCreditGroups = allGroups.filter((g) => !/credit/i.test(g)).sort();
  const idx120 = creditGroups.indexOf("120 Academic Credits");
  if (idx120 > 0) { creditGroups.splice(idx120, 1); creditGroups.unshift("120 Academic Credits"); }
  const ordered = [...creditGroups, ...nonCreditGroups];

  // how many times a code was selected
  function getCountFor(code?: string) {
    if (!code) return 0;
    return selectedCounts.get(norm(code)) ?? 0;
  }

  const result: RequirementSummary[] = []; // final summary list

  for (const group of ordered) {
    const courses = reqMap[group] as Array<{ code: string; credits?: number }>;
    const cfg = getGroupConfig(group);

  // make list with duplicates so we can easily slice for limits
    const expandedSelected: { code: string; credits?: number }[] = [];
    for (const c of courses) {
      const times = getCountFor(c.code);
      for (let i = 0; i < times; i++) expandedSelected.push(c);
    }

    let counted: { code: string; credits?: number }[] = [];
  // credit-based requirement (like total credits)
  if (typeof cfg.creditCap === "number") {
      let acc = 0;
      for (const c of expandedSelected) {
        const cr = c.credits ?? 0;
        if (acc + cr <= cfg.creditCap) { counted.push(c); acc += cr; }
        else break; // cap reached
      }
      const completedCredits = counted.reduce((s, c) => s + (c.credits ?? 0), 0);
      const percent = cfg.creditCap === 0 ? 0 : Math.round((completedCredits / cfg.creditCap) * 100);
      result.push({
        name: group,
        type: "credit",
        percent,
        completed: completedCredits,
        total: cfg.creditCap,
        countedCourseCodes: counted.map((c) => c.code),
        rawSelectedCourseCodes: expandedSelected.map((c) => c.code),
      });
      continue;
    }

  // count-based requirement (need certain number of courses)
  if (typeof cfg.requiredCount === "number" && cfg.requiredCount > 0) {
      if (cfg.sameSubject) {
        const bySubject: Record<string, { code: string; credits?: number }[]> = {};
        for (const c of expandedSelected) {
          const subj = (c.code || '').split(' ')[0] || '';
          if (!bySubject[subj]) bySubject[subj] = [];
          bySubject[subj].push(c);
        }
        let best: { code: string; credits?: number }[] = [];
        for (const k in bySubject) if (bySubject[k].length > best.length) best = bySubject[k];
        counted = best.slice(0, cfg.requiredCount);
      } else {
        counted = expandedSelected.slice(0, cfg.requiredCount);
      }
      const percent = Math.round((counted.length / cfg.requiredCount) * 100);
      result.push({
        name: group,
        type: "count",
        percent,
        completed: counted.length,
        total: cfg.requiredCount,
        countedCourseCodes: counted.map((c) => c.code),
        rawSelectedCourseCodes: expandedSelected.map((c) => c.code),
      });
      continue;
    }

  // groups without a fixed count or credit cap (just show unique selected)
    const uniqueSelected = new Set(expandedSelected.map((c) => c.code));
    const completed = uniqueSelected.size; // show unique picks rather than duplicates
    const total = courses.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    // For display, count all selected courses as counted (no caps)
    counted = expandedSelected;
    result.push({
      name: group,
      type: "count",
      percent,
      completed,
      total,
      countedCourseCodes: counted.map((c) => c.code),
      rawSelectedCourseCodes: expandedSelected.map((c) => c.code),
    });
  }

  return result; // done
}
