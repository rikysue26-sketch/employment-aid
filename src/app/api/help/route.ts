import { NextRequest, NextResponse } from "next/server";
import { prisma, resolveCollegeId } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collegeName = searchParams.get("collegeId") || "";
  const collegeId = await resolveCollegeId(collegeName);
  const status = searchParams.get("status") || "";

  const where: any = { inHelpList: true };
  if (collegeId) where.collegeId = collegeId;
  if (status) where.helpListStatus = status;

  const students = await prisma.student.findMany({
    where, include: { major: true, college: true, counselor: true,
      applications: { orderBy: { appliedAt: "desc" }, take: 1 },
      _count: { select: { applications: true, interviews: true } },
    },
    orderBy: [{ helpPriority: "desc" }, { riskLevel: "desc" }],
  });

  return NextResponse.json({
    students: students.map((s) => ({
      ...s, skills: JSON.parse(s.skills || "[]"),
      riskReasons: s.riskReasons ? JSON.parse(s.riskReasons) : [],
      lastActivity: s.applications[0]?.appliedAt || s.lastActivityAt,
      appCount: s._count.applications, interviewCount: s._count.interviews,
      applications: undefined, _count: undefined,
    })),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "confirm") {
    const { studentId, priority } = body;
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { helpListStatus: "confirmed", helpPriority: priority || 0 },
    });
    await prisma.helpAction.create({ data: { studentId, action: "确认加入重点帮扶名单", detail: `优先级：${priority || 0}` } });
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    const { studentId, reason } = body;
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { helpListStatus: "rejected", inHelpList: false },
    });
    await prisma.approval.create({ data: { userId: body.userId || "system", type: "help_list", targetId: studentId, decision: "rejected", reason } });
    await prisma.helpAction.create({ data: { studentId, action: "驳回Agent帮扶建议", detail: reason } });
    return NextResponse.json({ success: true });
  }

  if (action === "adjust-priority") {
    const { studentId, priority } = body;
    await prisma.student.update({ where: { id: studentId }, data: { helpPriority: priority } });
    return NextResponse.json({ success: true });
  }

  if (action === "batch-create-tasks") {
    const { studentIds, ownerId, type, taskAction, deadline, priority } = body;
    const created = [];
    for (const sid of studentIds) {
      const task = await prisma.task.create({
        data: { studentId: sid, ownerId, type, priority: priority || "medium", deadline: deadline ? new Date(deadline) : null, action: taskAction, status: "pending", followUps: JSON.stringify([]) },
      });
      created.push(task);
    }
    return NextResponse.json({ success: true, count: created.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
