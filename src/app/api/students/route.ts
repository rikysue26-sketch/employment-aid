import { NextRequest, NextResponse } from "next/server";
import { prisma, resolveCollegeId } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const collegeName = searchParams.get("collegeId") || "";
  const collegeId = await resolveCollegeId(collegeName);
  const majorId = searchParams.get("majorId") || "";
  const status = searchParams.get("status") || "";
  const riskLevel = searchParams.get("riskLevel") || "";
  const activityLevel = searchParams.get("activityLevel") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: any = {};
  if (collegeId) where.collegeId = collegeId;
  if (majorId) where.majorId = majorId;
  if (status) where.employmentStatus = status;
  if (riskLevel) where.riskLevel = riskLevel;
  if (activityLevel) where.activityLevel = activityLevel;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { studentNo: { contains: search } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        major: true, college: true, counselor: true,
        applications: { orderBy: { appliedAt: "desc" }, take: 1 },
        _count: { select: { applications: true, interviews: true, communications: true, tasks: true } },
      },
      orderBy: { studentNo: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({
    students: students.map((s) => ({
      ...s,
      skills: JSON.parse(s.skills || "[]"),
      lastApplication: s.applications[0]?.appliedAt || null,
      appCount: s._count.applications,
      interviewCount: s._count.interviews,
      commCount: s._count.communications,
      taskCount: s._count.tasks,
      applications: undefined,
      _count: undefined,
    })),
    total, page, pageSize, totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "batch-risk") {
    const { studentIds } = body;
    const results = [];
    for (const id of studentIds) {
      const res = await fetch(`${request.nextUrl.origin}/api/risk`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id }),
      });
      results.push(await res.json());
    }
    return NextResponse.json({ count: results.length, results });
  }

  if (action === "update-status") {
    const { studentId, status } = body;
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { employmentStatus: status, statusUpdatedAt: new Date() },
    });
    return NextResponse.json({ success: true, student: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
