"use client";

import { useState } from "react";
import Cell from "./Cell";

export default function Semester({ season, year }: { season: string; year: number }) {
	// Start with 4 cells, allow adding more dynamically
	const [cells, setCells] = useState<number[]>([0, 1, 2, 3]);

	const addCourse = () => {
		setCells((prev) => [...prev, (prev.at(-1) ?? -1) + 1]);
	};

	const deleteCourse = (cellId: number) => {
		setCells((prev) => prev.filter((id) => id !== cellId));
	};

	return (
		<div
			style={{
				background: "var(--surface)",
				border: "1px solid var(--border)",
				borderRadius: 8,
				padding: 12,
			}}
		>
			<h3 style={{ fontWeight: 600, marginBottom: 8 }}>
				{season} Semester Year {year}
			</h3>
			<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
				{cells.map((id) => (
					<Cell key={id} onDelete={() => deleteCourse(id)} />
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