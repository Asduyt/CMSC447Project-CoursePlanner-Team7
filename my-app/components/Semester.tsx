import Cell from "./Cell";

export default function Semester({season, year}: {season: string, year: number}) {

	return (
			<div
				style={{
					background: "var(--surface)",
					border: "1px solid var(--border)",
					borderRadius: 8,
					padding: 12,
				}}
			>
				<h3 style={{ fontWeight: 600, marginBottom: 8 }}>{season} Semester Year {year}</h3>
				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					<Cell />
					<Cell />
					<Cell />
					<Cell />
				</div>
			</div>
	)
}