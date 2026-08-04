import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const projectRoot = path.resolve(process.cwd());
    // On serverless, we can't reset the database. Just re-seed.
    await execAsync("npx prisma db push --accept-data-loss", { cwd: projectRoot, env: process.env, timeout: 60000 });
    await execAsync("npx tsx scripts/seed.ts", { cwd: projectRoot, env: process.env, timeout: 60000 });
    return NextResponse.json({ success: true, message: "演示数据已重置" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
