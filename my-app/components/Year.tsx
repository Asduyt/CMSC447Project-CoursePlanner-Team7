"use client";

// Year component: shows Fall/Winter/Spring/Summer semesters for one year.
// Keeps track of credits via callbacks passed from parent.
import Semester from "./Semester";

type YearProps = {
  year: number;
  yearCredits: number;
  hasWinter?: boolean;
  hasSummer?: boolean;
  onRemoveWinter?: () => void;
  onRemoveSummer?: () => void;
  onFallCreditsChange: (n: number) => void;
  onSpringCreditsChange: (n: number) => void;
  onWinterCreditsChange?: (n: number) => void;
  onSummerCreditsChange?: (n: number) => void;
  presets?: {
    fall?: string[];
    winter?: string[];
    spring?: string[];
    summer?: string[];
  };
  onCourseChange?: (prevCode: string | null, nextCode: string | null) => void;
  onSemesterSnapshot?: (year: number, season: string, courses: { code: string; name: string; credits: number }[]) => void;
};

export default function Year({
  year,
  yearCredits,
  hasWinter = false,
  hasSummer = false,
  onRemoveWinter,
  onRemoveSummer,
  onFallCreditsChange,
  onSpringCreditsChange,
  onWinterCreditsChange,
  onSummerCreditsChange,
  presets,
  onCourseChange,
  onSemesterSnapshot,
}: YearProps) {
  // render all the semesters for this year
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year {year}</h2>
        <div>Year credits: {yearCredits}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fall semester */}
        <Semester season="Fall" year={year} onCreditsChange={onFallCreditsChange} onCourseChange={onCourseChange} presetCourseCodes={presets?.fall} onSnapshot={(courses) => onSemesterSnapshot?.(year, "Fall", courses)} />
        {hasWinter && (
          // Winter semester (optional)
          <Semester season="Winter" year={year} onCreditsChange={onWinterCreditsChange} onDelete={onRemoveWinter} onCourseChange={onCourseChange} presetCourseCodes={presets?.winter} onSnapshot={(courses) => onSemesterSnapshot?.(year, "Winter", courses)} />
        )}
        {/* Spring semester */}
        <Semester season="Spring" year={year} onCreditsChange={onSpringCreditsChange} onCourseChange={onCourseChange} presetCourseCodes={presets?.spring} onSnapshot={(courses) => onSemesterSnapshot?.(year, "Spring", courses)} />
        {hasSummer && (
          // Summer semester (optional)
          <Semester season="Summer" year={year} onCreditsChange={onSummerCreditsChange} onDelete={onRemoveSummer} onCourseChange={onCourseChange} presetCourseCodes={presets?.summer} onSnapshot={(courses) => onSemesterSnapshot?.(year, "Summer", courses)} />
        )}
      </div>
    </div>
  );
}
