"use client";

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
  return (
    <aside
      style={{
        background: "var(--surface)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 16,
        width: 300,
        position: "sticky",
        top: 16,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>Degree Requirements</h2>
      <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, opacity: 0.8 }}>
        Linked to planner selections. Items are checked automatically.
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {requirements.map((req) => {
          const key = req.code.replace(/\s+/g, "").toUpperCase();
          const isDone = !!completedSet?.has(key);
          return (
            <li
              key={req.code}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={isDone}
                  readOnly
                  style={{ cursor: "default" }}
                />
                <span style={{ fontWeight: 500 }}>{req.code}</span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 6px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: isDone ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  color: isDone ? "#10b981" : "var(--foreground)",
                }}
              >
                {isDone ? "Completed" : "Incomplete"}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
