"use client";

import { useEffect, useState } from "react";
import Cell from "./cell";
import courses from "@/data/courses.json";

export default function Semester({ season, year, onCreditsChange, onDelete, onCourseChange, presetCourseCodes }: { season: string; year: number; onCreditsChange?: (total: number) => void; onDelete?: () => void; onCourseChange?: (prevCode: string | null, nextCode: string | null) => void; presetCourseCodes?: string[] }) {
	// Start with 4 cells, allow adding more dynamically
	const [cells, setCells] = useState<number[]>([0, 1, 2, 3]);
	// track credits for each cell by id
	const [credits, setCredits] = useState<Record<number, number | null>>({ 0: null, 1: null, 2: null, 3: null });
	// track selected course code per cell
	const [codes, setCodes] = useState<Record<number, string | null>>({ 0: null, 1: null, 2: null, 3: null });

	// helper to get next cell id
	const getNextId = (list: number[]) => (list.length === 0 ? 0 : list[list.length - 1] + 1);

	// helper to compute total credits from a list of cell ids
	const computeTotal = (ids: number[], creditMap: Record<number, number | null>) => {
		let sum = 0;
		for (let i = 0; i < ids.length; i++) {
			const id = ids[i];
			sum += creditMap[id] ?? 0;
		}
		return sum;
	};

	// when a preset course list is provided, expand to that size so we can render all items
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
			return [...prev, ...extra];
		});
	}, [presetCourseCodes]);

	// notify parent to decrement any selected codes in this semester
	useEffect(() => {
		return () => {
			if (onCourseChange) {
				Object.values(codes).forEach((code) => {
					if (code) onCourseChange(code, null);
				});
			}
		};
	}, []);

	// function to add a new course cell
	const addCourse = () => {
		setCells((prev) => {
			const nextId = (prev.at(-1) ?? -1) + 1;
			// initialize credit slot for new cell
			setCredits((c) => ({ ...c, [nextId]: null }));
			return [...prev, nextId];
		});
	};

	// function to delete a course cell
	const deleteCourse = (cellId: number) => {
		setCells((prev) => prev.filter((id) => id !== cellId));
		setCredits((c) => {
			const copy = { ...c };
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

	// report credit changes whenever total changes
	const total = computeTotal(cells, credits);
	useEffect(() => {
		onCreditsChange?.(total);
	}, [total]);

	// Check if this is a Winter or Summer semester
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
			    presetCourse={presetCourse}
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