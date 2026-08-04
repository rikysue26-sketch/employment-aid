import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const count = await prisma.student.count();
    return NextResponse.json({ success: true, studentCount: count });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const count = await prisma.student.count();
    if (count > 0) {
      return NextResponse.json({ success: true, message: "数据库已有数据", count });
    }
    // Run prisma db push and seed
    const cwd = process.cwd();
    await execAsync("npx prisma db push --accept-data-loss", { cwd, env: process.env, timeout: 60000 });
    await execAsync("npx tsx scripts/seed.ts", { cwd, env: process.env, timeout: 120000 });
    const newCount = await prisma.student.count();
    return NextResponse.json({ success: true, message: "数据库初始化完成", count: newCount });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
