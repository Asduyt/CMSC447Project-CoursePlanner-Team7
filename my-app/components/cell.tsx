'use client'

import { useState, useRef, useEffect } from "react";
import courses from "@/data/courses.json";

// This component renders a text input paired with a datalist to provide a dropdown of suggestions.
export default function Cell({ onDelete, onChange, onGradeChange, presetCourse }: { onDelete?: () => void; onChange?: (course: { code: string; name: string; credits: number } | null) => void; onGradeChange?: (grade: string | null) => void; presetCourse?: { code: string; name: string; credits: number } | null }) {
	const [value, setValue] = useState("");
		const [open, setOpen] = useState(false);
		const wrapperRef = useRef<HTMLDivElement | null>(null);
		const inputRef = useRef<HTMLInputElement | null>(null);
		const listRef = useRef<HTMLUListElement | null>(null);
		const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const [selected, setSelected] = useState<{ code: string; name: string; credits: number } | null>(null);

	// grade state for this cell (A,B,C,D,E,F,W or null)
	const [grade, setGrade] = useState<string | null>(null);

	// simple named handler for grade changes to keep code easy to follow
	function handleGradeChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const value = e.target.value;
		const v = value === "" ? null : value;
		setGrade(v);
		if (onGradeChange) {
			onGradeChange(v);
		}
	}

	// named delete handler so JSX is simple and readable
	function handleDelete() {
		setValue("");
		setSelected(null);
		setOpen(false);
		onChange?.(null);
		if (onDelete) onDelete();
	}

		useEffect(() => {
				if (listRef.current && highlightedIndex !== null) {
					// We render a blank option at the top, so shift index by +1 for real items.
					const indexInChildren = highlightedIndex >= 0 ? highlightedIndex + 1 : 0;
					const el = listRef.current.children[indexInChildren] as HTMLElement | undefined;
					if (el) el.scrollIntoView({ block: 'nearest' });
				}
			}, [highlightedIndex]);

			useEffect(() => {
				function handleClickOutside(e: MouseEvent) {
					if (!wrapperRef.current) return;
					if (e.target instanceof Node && !wrapperRef.current.contains(e.target)) {
						setOpen(false);
					}
				}

				document.addEventListener("mousedown", handleClickOutside);
				return () => document.removeEventListener("mousedown", handleClickOutside);
			}, []);

		// add the preset course stuff
		useEffect(() => {
			if (!presetCourse) return;
			// if already selected to this course, skip
			if (selected && selected.code === presetCourse.code) return;
			const composed = `${presetCourse.code} ${presetCourse.name}`;
			setValue(composed);
			setSelected(presetCourse);
			onChange?.(presetCourse);
		}, [presetCourse?.code, presetCourse?.name, presetCourse?.credits]);

	// moved json loading outside of component and into a new file
	return (
		<div>
			<label htmlFor="course-input" className="sr-only">
				Course
			</label>
			{/* made some changes to fit all of the class name text */}
			<div className="flex items-center" style={{ width: "100%" }}>
					{/* Delete button */}
					{onDelete && (
						<button
							type="button"
							onClick={handleDelete}
							style={{
								background: "transparent",
								border: "none",
								padding: "6px 8px",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "14px",
								lineHeight: 1,
								color: "var(--foreground)",
								marginRight: "4px",
							}}
							aria-label="Delete course"
							title="Delete course"
						>
							×
						</button>
					)}
					<div
						ref={wrapperRef}
						className="relative"
						style={{ display: "flex", alignItems: "center", width: "100%" }}
					>
					<input
						ref={inputRef}
						id="course-input"
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							setHighlightedIndex(0);
							// while typing, treat as not selected
							if (selected) {
								setSelected(null);
								onChange?.(null);
							}
						}}
						onClick={() => {
							setOpen((prev) => !prev);
							if (!open) setHighlightedIndex(0);
						}}
						onKeyDown={(e) => {
							const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
							const q = norm(value);
							const filtered = courses.filter((c) => norm(`${c.code} ${c.name}`).includes(q));
							if (e.key === "ArrowDown") {
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
							} else if (e.key === "ArrowUp") {
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
							} else if (e.key === "Enter") {
								e.preventDefault();
								if (open && highlightedIndex !== null) {
									const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
									const q = norm(value);
									const filtered = courses.filter((c) => norm(`${c.code} ${c.name}`).includes(q));
									const chosen = filtered[highlightedIndex];
									if (chosen) {
										setValue(`${chosen.code} ${chosen.name}`);
										setSelected(chosen);
										onChange?.(chosen);
									}
									setOpen(false);
								}
							} else if (e.key === "Escape") {
								setOpen(false);
							}
						}}
						onBlur={() => {
							// delay to allow click on list item 
							setTimeout(() => {
								if (!open) {
									// if closed, validate current value
									const validStrings = courses.map((c) => `${c.code} ${c.name}`);
									if (!validStrings.includes(value)) {
										setValue("");
										setSelected(null);
										onChange?.(null);
									}
								}
							}, 150);
						}}
						// style stuff changes
						placeholder="Select or type a course"
						className="rounded-l px-2 py-1"
						style={{
							background: "var(--surface)",
							color: "var(--foreground)",
							border: "1px solid var(--border)",
							flex: 1,
							minWidth: 0,
						}}
						aria-haspopup="listbox"
						aria-expanded={open}
					/>
					<button
						type="button"
						onClick={() => {
							setOpen((prev) => !prev);
							if (!open) setHighlightedIndex(0);
						}}
						// more style stuff changes
						className="rounded-r px-2 py-1"
						style={{
							background: "var(--surface)",
							color: "var(--foreground)",
							border: "1px solid var(--border)",
							borderLeft: "none",
							cursor: "pointer"
						}}
						aria-label="Toggle course list"
					>
						<span className={`inline-block transform ${open ? "rotate-180" : "rotate-0"}`}>
							▾
						</span>
					</button>
					{/* credits display */}
					<div
						style={{
							minWidth: 60,
							textAlign: "right",
							paddingLeft: 8,
							color: "var(--foreground)",
							fontSize: 14,
						}}
						aria-label="Selected course credits"
					>
						{selected ? `${selected.credits} cr` : ""}
					</div>

					{/* grade selector */}
					<div style={{ marginLeft: 8 }}>
						<label className="sr-only">Grade</label>
						<select
							value={grade ?? ""}
							onChange={handleGradeChange}
							style={{
								background: "var(--surface)",
								color: "var(--foreground)",
								border: "1px solid var(--border)",
								padding: "6px",
								borderRadius: 6,
							}}
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
					</div>
					{open && (
							<ul
								ref={listRef}
								role="listbox"
								className="absolute top-full z-10 mt-1 max-h-48 overflow-auto rounded p-1 shadow"
								style={{
									background: "var(--surface)",
									color: "var(--foreground)",
									border: "1px solid var(--border)",
									left: 0,
									right: 0,
									width: "100%",
								}}
								>
							{(() => {
									const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
									const q = norm(value);
									const filtered = courses.filter((c) => norm(`${c.code} ${c.name}`).includes(q));
									const items = [] as any[];

									// Blank option at the top
									items.push(
										<li
											key="__none"
											role="option"
											onMouseEnter={() => setHighlightedIndex(-1)}
											onMouseDown={(e) => {
												e.preventDefault();
												// clear selection and grade in an explicit simple way
												setValue("");
												setSelected(null);
												onChange?.(null);
												setGrade(null);
												if (onGradeChange) onGradeChange(null);
												setOpen(false);
											}}
											className="cursor-pointer rounded px-2 py-1"
											style={{
												background: highlightedIndex === -1 ? "var(--active)" : "transparent",
												opacity: 0.9,
												fontStyle: "italic",
											}}
										>
											Select or type a course
										</li>
									);

									if (filtered.length === 0) {
										items.push(
											<li key="__no_matches" className="px-2 py-1" style={{ color: "var(--muted)" }}>
												No matches
											</li>
										);
									} else {
										items.push(
											...filtered.map((c, idx) => (
												<li
													key={c.code}
													role="option"
													onMouseEnter={() => setHighlightedIndex(idx)}
													onMouseDown={(e) => {
														// onMouseDown so the input doesn't lose focus before click
														e.preventDefault();
														setValue(`${c.code} ${c.name}`);
														setSelected(c);
														onChange?.(c);
														// reset grade when selecting a new course (user can change it)
														setGrade(null);
														if (onGradeChange) onGradeChange(null);
														setOpen(false);
													}}
													className={`cursor-pointer rounded px-2 py-1`}
													style={{
														background: highlightedIndex === idx ? "var(--active)" : "transparent",
													}}
												>
													{c.code} {c.name}
												</li>
											))
										);
									}

									return items;
							})()}
						</ul>
					)}
					</div>
				</div>
		</div>
	);
}