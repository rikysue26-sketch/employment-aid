import { NextRequest, NextResponse } from "next/server";
import { analyzeStudentRisk } from "@/lib/risk-engine";

export async function POST(request: NextRequest) {
  const { studentId } = await request.json();
  if (!studentId) return NextResponse.json({ error: "缺少studentId" }, { status: 400 });
  try {
    const result = await analyzeStudentRisk(studentId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
