"use client";

import { useEffect, useState } from "react";

// theme toggle for if the user wants light mode, dark mode, or the system default
// options:
// - system: follow OS setting
// - light: force light mode
// - dark: force dark mode
export default function ThemeToggle() {
  const [choice, setChoice] = useState<string>("system");

  // on start, read saved choice (if any)
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme-choice") : null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      setChoice(saved);
      applyTheme(saved);
    } else {
      // default to system
      applyTheme("system");
    }
  }, []);

  function applyTheme(next: string) {
    // this is the <html> element where we'd change the mode
    const html = document.documentElement;
    if (next === "system") {
      // remove explicit data-theme so CSS can use prefers-color-scheme
      html.removeAttribute("data-theme");
    } else if (next === "light") {
      html.setAttribute("data-theme", "light");
    } else if (next === "dark") {
      html.setAttribute("data-theme", "dark");
    }
  }
  // when user changes the select
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setChoice(value);
    localStorage.setItem("theme-choice", value);
    applyTheme(value);
  }

  return (
    // the simple select dropdown
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <label htmlFor="theme-select">Theme:</label>
      <select
        id="theme-select"
        value={choice}
        onChange={handleChange}
        style={{
          background: "var(--surface)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          padding: "4px 8px",
          borderRadius: 6,
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
