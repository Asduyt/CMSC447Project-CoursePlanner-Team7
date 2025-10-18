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
}: YearProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Year {year}</h2>
        <div>Year credits: {yearCredits}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Semester season="Fall" year={year} onCreditsChange={onFallCreditsChange} />
        {hasWinter && (
          <Semester season="Winter" year={year} onCreditsChange={() => {}} onDelete={onRemoveWinter} />
        )}
        <Semester season="Spring" year={year} onCreditsChange={onSpringCreditsChange} />
        {hasSummer && (
          <Semester season="Summer" year={year} onCreditsChange={() => {}} onDelete={onRemoveSummer} />
        )}
      </div>
    </div>
  );
}
