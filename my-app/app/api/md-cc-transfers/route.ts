import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

    // Make sure the backend python script exists before trying to run it.
    const backendCandidates = [
      join(process.cwd(), "backend", "transfer.py"),
      join(process.cwd(), "my-app", "backend", "transfer.py"),
      join(process.cwd(), "..", "backend", "transfer.py"),
    ];
    const backendPath = backendCandidates.find((p) => existsSync(p));
    if (!backendPath) {
      return NextResponse.json({ error: `backend/transfer.py not found. Checked: ${backendCandidates.join(", ")}` }, { status: 500 });
    }

    const rows = await runPython({ formerSchool, umbcPrefix, year, oldSchoolClass, backendPath });
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
    // Windows virtualenv layout
    join(root, "..", ".venv", "Scripts", "python.exe"),
    join(root, ".venv", "Scripts", "python.exe"),
    "python",
    "python3",
  ];
  for (const p of candidates) {
    if (p === "python" || p === "python3" || existsSync(p)) return p;
  }
  return "python3";
}

// since we have arguments for the inputs, we need to provide them
function buildArgs(opts: {
  formerSchool: number;
  umbcPrefix?: string;
  year?: number;
  oldSchoolClass?: string;
  backendPath: string;
}): string[] {
  const backendPath = opts.backendPath;
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
  backendPath: string;
}): Promise<TransferRow[]> {
  const python = getPythonExec();
  const args = buildArgs(opts as any);

  // need to fetch the data from the table + parse it (threw some error handling since i had some issues when testing)
  const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
    let out = "";
    let err = "";
    let code = 1;
    try {
      const child = spawn(python, args, { cwd: process.cwd() });
      child.stdout.on("data", (d) => (out += String(d)));
      child.stderr.on("data", (d) => (err += String(d)));
      child.on("close", (c) => {
        code = c ?? 1;
        resolve({ stdout: out, stderr: err, code });
      });
      child.on("error", (e) => {
        // return the error message so we can surface it to the client
        resolve({ stdout: out, stderr: String(e?.message || e || "spawn error"), code: 1 });
      });
    } catch (e: any) {
      resolve({ stdout: out, stderr: String(e?.message || e || "spawn error"), code: 1 });
    }
  });

  const { stdout, stderr, code } = result;

  try {
    const parsed = JSON.parse(stdout || "{}");
    if (code === 0 && parsed && Array.isArray(parsed.rows)) return parsed.rows as TransferRow[];
    throw new Error(parsed?.error || stderr || `python exited ${code}`);
  } catch (e: any) {
    throw new Error(e?.message || stderr || `python exited ${code}`);
  }
}
