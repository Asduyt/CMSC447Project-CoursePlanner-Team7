"use client";

type Course = {
  code: string;
  name?: string;
  credits?: number;
};

export default function RequirementCourse({
  course,
  completedSet,
}: {
  course: Course;
  completedSet?: Set<string>;
}) {
  const key = (course.code || "").replace(/\s+/g, "").toUpperCase();
  const isDone = !!completedSet?.has(key);

  return (
    <li
      key={course.code}
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
        <input type="checkbox" checked={isDone} readOnly style={{ cursor: "default" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600 }}>{course.code}{course.name ? ` ${course.name}` : ""}</span>
          {course.credits != null && <span style={{ fontSize: 12, color: "var(--muted)" }}>{course.credits} cr</span>}
        </div>
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
}
