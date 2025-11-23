// This helper builds a summary of requirement progress.
// It is used when exporting CSV/PDF.
import catalog from "@/data/courses.json";

export type RequirementSummary = {
  name: string; // requirement group name
  type: "credit" | "count"; // how we measure progress
  percent: number; // percent complete (0-100)
  completed: number; // credits earned OR count so far
  total: number; // credit cap OR needed count
  countedCourseCodes: string[]; // courses that actually count (respect caps and limits)
  rawSelectedCourseCodes: string[]; // every selected course (duplicates expanded)
};

// Simple configuration rules for some requirement group names.
function getGroupConfig(name: string) {
  const cfg: { requiredCount?: number; sameSubject?: boolean; creditCap?: number } = {};

  // These are simple rules. They match by name and set limits.
  if (name.match(/^Arts and Humanities$/i)) cfg.requiredCount = 3;
  if (name.match(/Computer Science Elective/i)) cfg.requiredCount = 2;
  if (name.match(/Computer Science Technical Electives/i)) cfg.requiredCount = 3;
  if (name.match(/^Science$/i)) {
    cfg.requiredCount = 2;
    cfg.sameSubject = true; // need two from same subject
  }
  if (name.match(/^Science Lab$/i)) cfg.requiredCount = 1;
  if (name.match(/English Composition/i)) cfg.requiredCount = 1;
  if (name.match(/^120 Academic Credits$/i)) cfg.creditCap = 120;
  if (name.match(/45 upper level credits/i)) cfg.creditCap = 45;

  return cfg;
}

// Normalize a course code for lookup: remove spaces and uppercase.
function normalizeCode(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/\s+/g, "").toUpperCase();
}

// Main function. Input: map of selected course code -> times selected.
// `extraCredits` allows callers to include transfer credits that do not map to
// any catalog course (these still count toward the 120-credit requirement).
export function computeRequirementsSummary(selectedCounts: Map<string, number>, extraCredits: number = 0): RequirementSummary[] {
  // Make a normalized copy of selectedCounts for easy lookup.
  const normalizedSelected = new Map<string, number>();
  for (const entry of selectedCounts.entries()) {
    const rawCode = entry[0];
    const count = entry[1] ?? 0;
    const key = normalizeCode(rawCode);
    normalizedSelected.set(key, count);
  }

  // Build a map from requirement name -> list of course objects.
  const requirementToCourses: Record<string, any[]> = {};
  const catalogArray = catalog as any[];
  for (let i = 0; i < catalogArray.length; i++) {
    const course = catalogArray[i];
    if (!Array.isArray(course.requirements)) continue;
    for (let j = 0; j < course.requirements.length; j++) {
      const reqName = (course.requirements[j] || "").trim();
      if (!reqName) continue;
      if (!requirementToCourses[reqName]) requirementToCourses[reqName] = [];
      requirementToCourses[reqName].push(course);
    }
  }

  // Order groups: put credit groups first, then others. Keep simple alphabetical order.
  const allGroups = Object.keys(requirementToCourses);
  const creditGroups: string[] = [];
  const otherGroups: string[] = [];
  for (let i = 0; i < allGroups.length; i++) {
    const g = allGroups[i];
    if (g.match(/credit/i)) creditGroups.push(g);
    else otherGroups.push(g);
  }
  creditGroups.sort();
  otherGroups.sort();

  // Make sure "120 Academic Credits" is first in credit groups if present.
  const idx120 = creditGroups.indexOf("120 Academic Credits");
  if (idx120 > 0) {
    creditGroups.splice(idx120, 1);
    creditGroups.unshift("120 Academic Credits");
  }

  const orderedGroups = creditGroups.concat(otherGroups);

  const summaries: RequirementSummary[] = [];

  // Process each group one by one.
  for (let gi = 0; gi < orderedGroups.length; gi++) {
    const groupName = orderedGroups[gi];
    const courses = requirementToCourses[groupName] || [];
    const cfg = getGroupConfig(groupName);

    // Build a list of selected course objects, repeating a course if it was selected multiple times.
    const expandedSelected: { code: string; credits?: number }[] = [];
    for (let ci = 0; ci < courses.length; ci++) {
      const course = courses[ci];
      const code = course.code || "";
      const times = normalizedSelected.get(normalizeCode(code)) || 0;
      for (let t = 0; t < times; t++) {
        expandedSelected.push(course);
      }
    }

    // If this group is credit-based (has a credit cap), count credits up to the cap.
    if (typeof cfg.creditCap === "number") {
      let accCredits = 0;
      const counted: { code: string; credits?: number }[] = [];
      for (let k = 0; k < expandedSelected.length; k++) {
        const c = expandedSelected[k];
        const cr = c.credits || 0;
        if (accCredits + cr <= cfg.creditCap) {
          counted.push(c);
          accCredits += cr;
        } else {
          break; // reached cap
        }
      }
      // If this is the 120 Academic Credits group, include any extra transfer credits
      // that were provided by the caller (these are credits that didn't map to
      // a catalog course but should still count toward the 120-cap).
      if (/^120 Academic Credits$/i.test(groupName) && typeof extraCredits === 'number' && extraCredits > 0) {
        accCredits += extraCredits;
      }
      const percent = cfg.creditCap === 0 ? 0 : Math.round((accCredits / cfg.creditCap) * 100);
      const summary: RequirementSummary = {
        name: groupName,
        type: "credit",
        percent: Math.min(100, Math.max(0, percent)),
        completed: accCredits,
        total: cfg.creditCap,
        countedCourseCodes: counted.map((x) => x.code),
        rawSelectedCourseCodes: expandedSelected.map((x) => x.code),
      };
      summaries.push(summary);
      continue;
    }

    // If this group needs a fixed number of courses, pick the first N selected.
    if (typeof cfg.requiredCount === "number" && cfg.requiredCount > 0) {
      let counted: { code: string; credits?: number }[] = [];

      if (cfg.sameSubject) {
        // Group by subject (prefix before first space).
        const bySubject: Record<string, { code: string; credits?: number }[]> = {};
        for (let k = 0; k < expandedSelected.length; k++) {
          const c = expandedSelected[k];
          const raw = c.code || "";
          const parts = raw.split(" ");
          const subj = parts[0] || "";
          if (!bySubject[subj]) bySubject[subj] = [];
          bySubject[subj].push(c);
        }
        // Find the subject with the most selected courses.
        let best: { code: string; credits?: number }[] = [];
        for (const s in bySubject) {
          if (bySubject[s].length > best.length) best = bySubject[s];
        }
        counted = best.slice(0, cfg.requiredCount);
      } else {
        counted = expandedSelected.slice(0, cfg.requiredCount);
      }

      const percent = Math.round((counted.length / cfg.requiredCount) * 100);
      const summary: RequirementSummary = {
        name: groupName,
        type: "count",
        percent: Math.min(100, Math.max(0, percent)),
        completed: counted.length,
        total: cfg.requiredCount,
        countedCourseCodes: counted.map((x) => x.code),
        rawSelectedCourseCodes: expandedSelected.map((x) => x.code),
      };
      summaries.push(summary);
      continue;
    }

    // Default: no special rules. Show unique selected vs total available.
    const seen = new Set<string>();
    for (let k = 0; k < expandedSelected.length; k++) {
      seen.add(expandedSelected[k].code);
    }
    const completedCount = seen.size;
    const totalCount = courses.length;
    const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const summary: RequirementSummary = {
      name: groupName,
      type: "count",
      percent: Math.min(100, Math.max(0, percent)),
      completed: completedCount,
      total: totalCount,
      countedCourseCodes: expandedSelected.map((x) => x.code),
      rawSelectedCourseCodes: expandedSelected.map((x) => x.code),
    };
    summaries.push(summary);
  }

  return summaries;
}

