'use client'

// Simple course selection cell.
// You can type a course or pick from the dropdown.
import { useState, useRef, useEffect } from "react";
import courses from "@/data/courses.json"; // the big list of courses we can pick from

// This component lets the user pick a course and (optionally) a grade.
// It tells parent when the course or grade changes.
export default function Cell({ onDelete, onChange, onGradeChange, presetCourse, grade }: { onDelete?: () => void; onChange?: (course: { code: string; name: string; credits: number } | null) => void; onGradeChange?: (grade: string | null) => void; presetCourse?: { code: string; name: string; credits: number } | null; grade?: string | null }) {
  // current text inside the input
  const [value, setValue] = useState("");
  // whether dropdown list is open
  const [open, setOpen] = useState(false);
  // index of highlighted suggestion
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  // selected course object
  const [selected, setSelected] = useState<{ code: string; name: string; credits: number } | null>(null);
  // local grade state mirrors prop (so parent controls snapshot). We keep it simple.
  // grade picked in the little dropdown (we keep local + inform parent)
  const [localGrade, setLocalGrade] = useState<string | null>(grade ?? null);
  // refs to help with click outside and scrolling
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // scroll highlighted item into view so keyboard navigation feels nicer
  useEffect(() => {
    if (!listRef.current || highlightedIndex === null) return;
    const indexInChildren = highlightedIndex >= 0 ? highlightedIndex + 1 : 0;
    const el = listRef.current.children[indexInChildren] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // close dropdown if clicking outside it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (e.target instanceof Node && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // if a preset course is given we auto-fill it once
  useEffect(() => {
    if (!presetCourse) return;
    if (selected && selected.code === presetCourse.code) return;
    setValue(`${presetCourse.code} ${presetCourse.name}`);
    setSelected(presetCourse);
    onChange?.(presetCourse);
  }, [presetCourse?.code, presetCourse?.name, presetCourse?.credits]);

  // if parent changes the grade prop we copy it in
  useEffect(() => {
    setLocalGrade(grade ?? null);
  }, [grade]);

  // figure out which courses match what user typed
  const filtered = courses.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(value.toLowerCase()));

  return (
    <div style={{ width: '100%' }}>
      <div className="flex items-center" style={{ width: '100%' }}>
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              // clear cell then delete parent wrapper cell
              setValue("");
              setSelected(null);
              setOpen(false);
              onChange?.(null);
              setLocalGrade(null);
              onGradeChange?.(null);
              onDelete();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 8px',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              color: 'var(--foreground)',
              marginRight: 4,
            }}
            aria-label="Delete course"
          >×</button>
        )}
  <div ref={wrapperRef} className="relative" style={{ display: 'flex', alignItems: 'center', width: '100%', flex: 1, minWidth: 0 }}>
          <input
            value={value}
            placeholder="Select or type a course"
            onChange={(e) => {
              setValue(e.target.value);
              setHighlightedIndex(0);
              if (selected) {
                setSelected(null);
                onChange?.(null);
              }
            }}
            onClick={() => {
              setOpen((o) => !o);
              if (!open) setHighlightedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!open) {
                  setOpen(true);
                  setHighlightedIndex(filtered.length > 0 ? 0 : null);
                  return;
                }
                setHighlightedIndex((prev) => {
                  if (filtered.length === 0) return null;
                  if (prev === null) return 0;
                  return Math.min(prev + 1, filtered.length - 1);
                });
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!open) {
                  setOpen(true);
                  setHighlightedIndex(filtered.length > 0 ? filtered.length - 1 : null);
                  return;
                }
                setHighlightedIndex((prev) => {
                  if (filtered.length === 0) return null;
                  if (prev === null) return filtered.length - 1;
                  return Math.max(prev - 1, 0);
                });
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (open && highlightedIndex !== null) {
                  const chosen = filtered[highlightedIndex];
                  if (chosen) {
                    setValue(`${chosen.code} ${chosen.name}`);
                    setSelected(chosen);
                    onChange?.(chosen);
                    // keep grade but do nothing; user can choose after selecting
                  }
                  setOpen(false);
                }
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            onBlur={() => {
              // small delay so clicks on list still register
              setTimeout(() => {
                if (!open) {
                  const valid = courses.some((c) => `${c.code} ${c.name}` === value);
                  if (!valid) {
                    setValue("");
                    setSelected(null);
                    onChange?.(null);
                  }
                }
              }, 120);
            }}
            style={{
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              flex: 1,
              minWidth: 0,
              padding: '6px 8px'
            }}
            aria-haspopup="listbox"
            aria-expanded={open}
          />
          <button
            type="button"
            onClick={() => {
              setOpen((o) => !o);
              if (!open) setHighlightedIndex(0);
            }}
            style={{
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderLeft: 'none',
              cursor: 'pointer',
              padding: '6px 8px'
            }}
            aria-label="Toggle course list"
          >
            <span className={`inline-block transform ${open ? 'rotate-180' : 'rotate-0'}`}>▾</span>
          </button>
          <div style={{ minWidth: 60, textAlign: 'right', paddingLeft: 8, fontSize: 14 }} aria-label="Selected course credits">
            {selected ? `${selected.credits} cr` : ''}
          </div>
          {open && (
            <ul
              ref={listRef}
              role="listbox"
              className="absolute top-full z-10 mt-1 max-h-48 overflow-auto rounded p-1 shadow"
              style={{
                background: 'var(--surface)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                left: 0,
                right: 0,
                width: '100%'
              }}
            >
              {/* blank option */}
              <li
                role="option"
                onMouseEnter={() => setHighlightedIndex(-1)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue("");
                  setSelected(null);
                  onChange?.(null);
                  setLocalGrade(null);
                  onGradeChange?.(null);
                  setOpen(false);
                }}
                className="cursor-pointer rounded px-2 py-1"
                style={{ background: highlightedIndex === -1 ? 'var(--active)' : 'transparent', fontStyle: 'italic' }}
              >
                Select or type a course
              </li>
              {filtered.length === 0 && (
                <li className="px-2 py-1" style={{ color: 'var(--muted)' }}>No matches</li>
              )}
              {filtered.map((c, idx) => (
                <li
                  key={c.code}
                  role="option"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setValue(`${c.code} ${c.name}`);
                    setSelected(c);
                    onChange?.(c);
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded px-2 py-1"
                  style={{ background: highlightedIndex === idx ? 'var(--active)' : 'transparent' }}
                >
                  {c.code} {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* grade selector back on the right; wrapper flex:1 keeps input wide */}
        {selected && (
          <select
            value={localGrade ?? ''}
            onChange={(e) => {
              const val = e.target.value || null;
              setLocalGrade(val);
              onGradeChange?.(val);
            }}
            style={{
              marginLeft: 6,
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              padding: '4px 6px',
              fontSize: 12,
              borderRadius: 4,
              flexShrink: 0
            }}
            aria-label="Select grade"
          >
            <option value="">Grade</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="W">W</option>
          </select>
        )}
      </div>
    </div>
  );
}