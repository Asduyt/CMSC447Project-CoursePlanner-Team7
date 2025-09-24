"use client";

import { useEffect, useMemo, useState } from "react";
import Cell from "./Cell";

export default function Semester({ season, year, onCreditsChange }: { season: string; year: number; onCreditsChange?: (total: number) => void }) {
	// Start with 4 cells, allow adding more dynamically
	const [cells, setCells] = useState<number[]>([0, 1, 2, 3]);
	// track credits for each cell by id
	const [credits, setCredits] = useState<Record<number, number | null>>({ 0: null, 1: null, 2: null, 3: null });

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
	};

	// compute total credits for this semester
	const total = useMemo(() => {
		return cells.reduce((sum, id) => sum + (credits[id] ?? 0), 0);
	}, [cells, credits]);

	// if total changes, notify parent
	useEffect(() => {
		onCreditsChange?.(total);
	}, [total, onCreditsChange]);

	return (
		<div
			style={{
				background: "var(--surface)",
				border: "1px solid var(--border)",
				borderRadius: 8,
				padding: 12,
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
		</div>
	);
}