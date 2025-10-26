"use client";

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
  onCourseChange?: (prevCode: string | null, nextCode: string | null) => void;
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
  onCourseChange,
}: YearProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year {year}</h2>
        <div>Year credits: {yearCredits}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Semester season="Fall" year={year} onCreditsChange={onFallCreditsChange} onCourseChange={onCourseChange} />
        {hasWinter && (
          <Semester season="Winter" year={year} onCreditsChange={() => {}} onDelete={onRemoveWinter} onCourseChange={onCourseChange} />
        )}
        <Semester season="Spring" year={year} onCreditsChange={onSpringCreditsChange} onCourseChange={onCourseChange} />
        {hasSummer && (
          <Semester season="Summer" year={year} onCreditsChange={() => {}} onDelete={onRemoveSummer} onCourseChange={onCourseChange} />
        )}
      </div>
    </div>
  );
}
