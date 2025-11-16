"use client";

// A single semester box. Holds several course cells.
// We keep this simple: arrays of cell ids, and maps for credits and codes.
import { useEffect, useState } from "react";
import Cell from "./cell"; // small course input box
import courses from "@/data/courses.json";

// shape of a course in the snapshot we give back to parent
// We now also include an optional grade string chosen by user (like A, B+, etc.)
// A snapshot course is what we send upward for exports.
// grade is optional because user might not pick one.
export type SnapshotCourse = { code: string; name: string; credits: number; grade?: string | null };

export default function Semester({ season, year, onCreditsChange, onDelete, onCourseChange, presetCourseCodes, onSnapshot }: { season: string; year: number; onCreditsChange?: (total: number) => void; onDelete?: () => void; onCourseChange?: (prevCode: string | null, nextCode: string | null) => void; presetCourseCodes?: string[]; onSnapshot?: (courses: SnapshotCourse[]) => void }) {
	// start with 4 blank course cells
	const [cells, setCells] = useState<number[]>([0, 1, 2, 3]);
	// credits chosen for each cell (keyed by id)
	const [credits, setCredits] = useState<Record<number, number | null>>({ 0: null, 1: null, 2: null, 3: null });
	// course codes typed/selected for each cell (keyed by id)
	const [codes, setCodes] = useState<Record<number, string | null>>({ 0: null, 1: null, 2: null, 3: null });
	// grades picked for each cell (keyed by id); starts empty
	const [grades, setGrades] = useState<Record<number, string | null>>({ 0: null, 1: null, 2: null, 3: null });

    // find the next id number to use
    const getNextId = (list: number[]) => (list.length === 0 ? 0 : list[list.length - 1] + 1);

    // sum up credits for given ids
    const computeTotal = (ids: number[], creditMap: Record<number, number | null>) => {
      let sum = 0;
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        sum += creditMap[id] ?? 0;
      }
      return sum;
    };

	// if parent passes preset course list, make sure we have enough cells
	useEffect(() => {
		if (!presetCourseCodes || presetCourseCodes.length === 0) return;
		setCells((prev) => {
			const needed = presetCourseCodes.length - prev.length;
			if (needed <= 0) return prev;
			const start = getNextId(prev);
			const extra: number[] = [];
			for (let i = 0; i < needed; i++) extra.push(start + i);
			setCredits((c) => {
				const copy: Record<number, number | null> = { ...c };
				extra.forEach((id) => (copy[id] = null));
				return copy;
			});
			setGrades((g) => {
				const copy: Record<number, string | null> = { ...g };
				extra.forEach((id) => (copy[id] = null));
				return copy;
			});
			return [...prev, ...extra];
		});
	}, [presetCourseCodes]);

	// when the semester unmounts, remove all its selected courses from counts
	useEffect(() => {
		return () => {
			if (onCourseChange) {
				Object.values(codes).forEach((code) => {
					if (code) onCourseChange(code, null);
				});
			}
		};
	}, []);

	// add a new empty course cell
	// make a brand new blank cell (no code, no credits, no grade)
	const addCourse = () => {
		setCells((prev) => {
			const nextId = (prev.at(-1) ?? -1) + 1;
			// initialize credit slot for new cell
			setCredits((c) => ({ ...c, [nextId]: null }));
			// initialize grade slot for new cell
			setGrades((g) => ({ ...g, [nextId]: null }));
			return [...prev, nextId];
		});
	};

	// delete a course cell and clean up its code/credits
	// remove a cell and also clear its code, credits, grade
	const deleteCourse = (cellId: number) => {
		setCells((prev) => prev.filter((id) => id !== cellId));
		setCredits((c) => {
			const copy = { ...c };
			delete copy[cellId];
			return copy;
		});
		setGrades((g) => {
			const copy = { ...g };
			delete copy[cellId];
			return copy;
		});
		// Read previous code before updating local state, then notify parent after local updates
		const prevCode = codes[cellId] ?? null;
		setCodes((c) => {
			const copy = { ...c };
			delete copy[cellId];
			return copy;
		});
		if (prevCode) {
			onCourseChange?.(prevCode, null);
		}
	};

	// let parent know our total credits each time they change
	const total = computeTotal(cells, credits);
	// Build a clean list of selected courses whenever anything changes
	useEffect(() => {
		onCreditsChange?.(total);
	}, [total]);

	// build list of selected courses for export whenever codes change
	useEffect(() => {
		if (!onSnapshot) return;
		const selected: SnapshotCourse[] = [];
		// preserve visual order by iterating cells array
		for (let i = 0; i < cells.length; i++) {
			const id = cells[i];
			const code = codes[id];
			if (!code) continue;
			// find in course catalog
			const match = (courses as any[]).find(
				(c) => String(c.code).toUpperCase() === String(code).toUpperCase()
			);
			if (match) {
				selected.push({ code: match.code as string, name: match.name as string, credits: (match.credits as number) ?? 0, grade: grades[id] ?? null });
			} else {
				// fallback if not found (shouldn't generally happen)
				selected.push({ code: String(code), name: String(code), credits: 0, grade: grades[id] ?? null });
			}
		}
		onSnapshot(selected);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [codes, cells, grades]);

	// show delete button for optional semesters
	const isOptionalSemester = season === "Winter" || season === "Summer";
	return (
		<div
			style={{
				background: "var(--surface)",
				border: "1px solid var(--border)",
				borderRadius: 8,
				padding: 12,
				position: "relative",
			}}
		>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
				<h3 style={{ fontWeight: 600, margin: 0 }}>
					{season} Semester Year {year}
				</h3>
				<div>Credits: {total}</div>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
		{cells.map((id, index) => {
			// find a preset course for this index (if any)
			let presetCourse: { code: string; name: string; credits: number } | undefined = undefined;
			if (presetCourseCodes && presetCourseCodes[index]) {
				const code = String(presetCourseCodes[index]);
				for (let i = 0; i < courses.length; i++) {
					const c = courses[i] as any;
					if (String(c.code).toUpperCase() === code.toUpperCase()) {
						presetCourse = { code: c.code, name: c.name, credits: c.credits as number };
						break;
					}
				}
			}
			return (
			// Render one cell. We pass down current grade and a handler so child can update it.
			<Cell
				key={id}
				onDelete={() => deleteCourse(id)}
				onChange={(course) => {
					// Compute prev/next first, update local state, then notify parent
					const prevCode = codes[id] ?? null;
					const nextCode = course?.code ?? null;
					setCredits((c) => ({ ...c, [id]: course?.credits ?? null }));
					setCodes((prev) => ({ ...prev, [id]: nextCode }));
					if (prevCode !== nextCode) {
						onCourseChange?.(prevCode, nextCode);
					}
		    }}
		    onGradeChange={(grade) => setGrades((g) => ({ ...g, [id]: grade }))}
		    presetCourse={presetCourse}
		    grade={grades[id] ?? null}
		    />
			);
		})}
			</div>

			<div style={{ marginTop: 10 }}>
				<button
					type="button"
					onClick={addCourse}
					style={{
						background: "var(--surface)",
						color: "var(--foreground)",
						border: "1px solid var(--border)",
						padding: "6px 10px",
						borderRadius: 6,
						cursor: "pointer",
					}}
				>
					+ Add Course
				</button>
			</div>

			{/* Show delete button only for Winter/Summer semesters */}
			{isOptionalSemester && onDelete && (
				<button
					onClick={onDelete}
					style={{
						position: 'absolute',
						bottom: 8,
						right: 8,
						background: "var(--surface)",
						color: "var(--foreground)",
						border: "1px solid var(--border)",
						padding: "6px 10px",
						borderRadius: 6,
						cursor: "pointer",
					}}
				>
					Delete Semester
				</button>
			)}
		</div>
	);
}