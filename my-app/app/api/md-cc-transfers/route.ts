import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";

// always run on Node.js (not edge) since we use Python
export const runtime = "nodejs";

type TransferRow = {
  course: string;
  credits: number | null;
  transfersAs: string;
};

// handle the data through requests
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const formerSchool: number | undefined = body.formerSchool;
    const umbcPrefix: string | undefined = body.umbcPrefix;
    const year: number | undefined = body.year;
    const oldSchoolClass: string | undefined = body.oldSchoolClass;

    if (!formerSchool) return NextResponse.json({ error: "formerSchool is required" }, { status: 400 });
    // to help simplify the search, I want to have at least one of umbcPrefix or oldSchoolClass provided
    if (!umbcPrefix && !oldSchoolClass) {
      return NextResponse.json(
        { error: "Provide at least one of: umbcPrefix or oldSchoolClass" },
        { status: 400 }
      );
    }

    const rows = await runPython({ formerSchool, umbcPrefix, year, oldSchoolClass });
    return NextResponse.json({ rows, source: "python" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Python scraper failed" }, { status: 500 });
  }
}
// make sure we get all the files
function getPythonExec(): string {
  const root = process.cwd();
  const candidates = [
    join(root, "..", ".venv", "bin", "python"),
    join(root, ".venv", "bin", "python"),
    "python3",
  ];
  for (const p of candidates) {
    if (p === "python3" || existsSync(p)) return p;
  }
  return "python3";
}

// since we have arguments for the inputs, we need to provide them
function buildArgs(opts: {
  formerSchool: number;
  umbcPrefix?: string;
  year?: number;
  oldSchoolClass?: string;
}): string[] {
  const backendPath = join(process.cwd(), "backend", "transfer.py");
  const args = [backendPath, "--former-school", String(opts.formerSchool)];
  if (opts.umbcPrefix) args.push("--umbc-class", opts.umbcPrefix);
  if (typeof opts.year === "number") args.push("--year", String(opts.year));
  if (opts.oldSchoolClass) args.push("--old-school-class", opts.oldSchoolClass);
  return args;
}

// running the python...
async function runPython(opts: {
  formerSchool: number;
  umbcPrefix?: string;
  year?: number;
  oldSchoolClass?: string;
}): Promise<TransferRow[]> {
  const python = getPythonExec();
  const args = buildArgs(opts);

  // need to fetch the data from the table + parse it (threw some error handling since i had some issues when testing)
  const { stdout, stderr, code } = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
    const child = spawn(python, args, { cwd: process.cwd() });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += String(d)));
    child.stderr.on("data", (d) => (err += String(d)));
    child.on("close", (code) => resolve({ stdout: out, stderr: err, code: code ?? 1 }));
    child.on("error", () => resolve({ stdout: out, stderr: err || "spawn error", code: 1 }));
  });

  try {
    const parsed = JSON.parse(stdout || "{}");
    if (code === 0 && parsed && Array.isArray(parsed.rows)) return parsed.rows as TransferRow[];
    throw new Error(parsed?.error || stderr || `python exited ${code}`);
  } catch (e: any) {
    throw new Error(e?.message || stderr || `python exited ${code}`);
  }
}
