'use client'

// Courses will be represented as one cell, which includes the code, name, and credits for the course. It will also store what requirements the course fulfills.

import { useState, useRef, useEffect } from "react";

// Courses will be represented as one cell, which includes the code, name, and credits for the course.
// This component renders a text input paired with a datalist to provide a dropdown of suggestions.
export default function Cell() {
		const [value, setValue] = useState("");
		const [open, setOpen] = useState(false);
		const wrapperRef = useRef<HTMLDivElement | null>(null);
		const inputRef = useRef<HTMLInputElement | null>(null);
		const listRef = useRef<HTMLUListElement | null>(null);
		const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

		useEffect(() => {
			if (listRef.current && highlightedIndex !== null) {
				const el = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
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

	// Dummy sample code, will change later into api fetch + json file
	const courses = [
		{
			"code": "CMSC201",
			"name": "Computer Science I",
			"credits": 3
		},
		{
			"code": "CMSC202",
			"name": "Computer Science II",
			"credits": 3
		},
		{
			"code": "CMSC203",
			"name": "Discrete Structures",
			"credits": 3
		},
		{
			"code": "MATH151",
			"name": "Calc. & Analytic Geom. I",
			"credits": 3
		}
	];

	return (
		<div>
			<label htmlFor="course-input" className="sr-only">
				Course
			</label>
			{/* made some changes to fit all of the class name text */}
			<div className="flex items-center" style={{ width: "100%" }}>
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
						}}
						onClick={() => {
							setOpen((prev) => !prev);
							if (!open) setHighlightedIndex(0);
						}}
						onKeyDown={(e) => {
							const filtered = courses.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(value.toLowerCase()));
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
									const filtered = courses.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(value.toLowerCase()));
									const chosen = filtered[highlightedIndex];
									if (chosen) {
										setValue(`${chosen.code} ${chosen.name}`);
									}
									setOpen(false);
								}
							} else if (e.key === "Escape") {
								setOpen(false);
							}
						}}
						onBlur={() => {
							// Delay to allow click on list item (onMouseDown handles selection)
							setTimeout(() => {
								if (!open) {
									// if closed, validate current value
									const validStrings = courses.map((c) => `${c.code} ${c.name}`);
									if (!validStrings.includes(value)) {
										setValue("");
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
						}}
						aria-label="Toggle course list"
					>
						{/* Simple arrow; replace with icon if desired */}
						<span className={`inline-block transform ${open ? "rotate-180" : "rotate-0"}`}>
							▾
						</span>
					</button>
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
								const filtered = courses.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(value.toLowerCase()));
								if (filtered.length === 0) {
									return (
										<li className="px-2 py-1" style={{ color: "var(--muted)" }}>No matches</li>
									);
								}
								return filtered.map((c, idx) => (
									<li
										key={c.code}
										role="option"
										onMouseDown={(e) => {
											// onMouseDown so the input doesn't lose focus before click
											e.preventDefault();
											setValue(`${c.code} ${c.name}`);
											setOpen(false);
										}}
										className={`cursor-pointer rounded px-2 py-1`}
										style={{
											background: highlightedIndex === idx ? "var(--active)" : "transparent",
										}}
									>
										{c.code} {c.name}
									</li>
									));
							})()}
						</ul>
					)}

					</div>

					{/* credits removed - reverted to previous layout */}
				</div>
		</div>
	);
}