"use client";

import { useEffect, useMemo, useState } from "react";
import Cell from "./cell";

export default function Semester({ season, year, onCreditsChange, onDelete, onCourseChange }: { season: string; year: number; onCreditsChange?: (total: number) => void; onDelete?: () => void; onCourseChange?: (prevCode: string | null, nextCode: string | null) => void }) {
	// Start with 4 cells, allow adding more dynamically
	const [cells, setCells] = useState<number[]>([0, 1, 2, 3]);
	// track credits for each cell by id
	const [credits, setCredits] = useState<Record<number, number | null>>({ 0: null, 1: null, 2: null, 3: null });
	// track selected course code per cell
	const [codes, setCodes] = useState<Record<number, string | null>>({ 0: null, 1: null, 2: null, 3: null });

	// On unmount, notify parent to decrement any selected codes in this semester
	useEffect(() => {
		return () => {
			if (onCourseChange) {
				Object.values(codes).forEach((code) => {
					if (code) onCourseChange(code, null);
				});
			}
		};
	// it's okay to depend on codes to capture latest selections; this effect only runs cleanup on unmount
	// eslint-disable-next-line react-hooks/exhaustive-deps
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
		setCodes((c) => {
			const prevCode = c[cellId] ?? null;
			if (prevCode) {
				onCourseChange?.(prevCode, null);
			}
			const copy = { ...c };
			delete copy[cellId];
			return copy;
		});
	};

	// compute total credits for this semester
	const total = useMemo(() => {
		return cells.reduce((sum, id) => sum + (credits[id] ?? 0), 0);
	}, [cells, credits]);

	// if total changes, notify parent
	useEffect(() => {
		onCreditsChange?.(total);
	}, [total, onCreditsChange]);

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
				{cells.map((id, index) => (
						<Cell
						key={id}
						onDelete={() => deleteCourse(id)}
						onChange={(course) => {
								setCredits((c) => ({ ...c, [id]: course?.credits ?? null }));
								setCodes((prev) => {
									const prevCode = prev[id] ?? null;
									const nextCode = course?.code ?? null;
									if (prevCode !== nextCode) {
										onCourseChange?.(prevCode, nextCode);
									}
									return { ...prev, [id]: nextCode };
								});
						}}
					/>
				))}
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