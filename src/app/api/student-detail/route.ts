import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mockResumeAdvice, mockCommOutline } from "@/lib/agent";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("id");
  if (!studentId) return NextResponse.json({ error: "缺少id" }, { status: 400 });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      major: true, college: true, counselor: true,
      applications: { include: { job: { include: { enterprise: true } } }, orderBy: { appliedAt: "desc" } },
      interviews: { orderBy: { date: "desc" } },
      communications: { include: { counselor: true }, orderBy: { date: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      recommendations: { include: { job: { include: { enterprise: true } } }, orderBy: { createdAt: "desc" } },
      helpActions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const recommendations = (student.recommendations || []).map((r: any) => ({
    ...r,
    matchedItems: JSON.parse(r.matchedItems || "[]"),
    unmatchedItems: JSON.parse(r.unmatchedItems || "[]"),
    hardCheck: JSON.parse(r.hardCheck || "[]"),
    gaps: JSON.parse(r.gaps || "[]"),
  }));

  return NextResponse.json({
    ...student,
    skills: JSON.parse(student.skills || "[]"),
    riskReasons: student.riskReasons ? JSON.parse(student.riskReasons) : [],
    recommendations,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, studentId } = body;

  if (action === "update-status") {
    const { status } = body;
    const updated = await prisma.student.update({
      where: { id: studentId }, data: { employmentStatus: status, statusUpdatedAt: new Date() },
    });
    await prisma.helpAction.create({ data: { studentId, action: "更新就业状态", detail: `状态更新为：${status}` } });
    return NextResponse.json({ success: true });
  }

  if (action === "add-comm") {
    const { counselorId, type, content, result } = body;
    const comm = await prisma.communication.create({
      data: { studentId, counselorId, type, content, result: result || null, date: new Date() },
    });
    await prisma.helpAction.create({ data: { studentId, action: "添加沟通记录", detail: content } });
    return NextResponse.json({ success: true, comm });
  }

  if (action === "create-task") {
    const { ownerId, type, priority, deadline, taskAction, acceptance } = body;
    const task = await prisma.task.create({
      data: { studentId, ownerId, type, priority, deadline: deadline ? new Date(deadline) : null, action: taskAction, acceptance: acceptance || null, status: "pending", followUps: JSON.stringify([]) },
    });
    await prisma.helpAction.create({ data: { studentId, action: "创建帮扶任务", detail: taskAction } });
    return NextResponse.json({ success: true, task });
  }

  if (action === "resume-advice") {
    const result = await mockResumeAdvice(studentId);
    await prisma.agentLog.create({ data: { taskType: "resume_advice", target: studentId, steps: JSON.stringify([]), summary: result.summary, status: "done" } });
    return NextResponse.json(result);
  }

  if (action === "comm-outline") {
    const result = await mockCommOutline(studentId);
    await prisma.agentLog.create({ data: { taskType: "comm_outline", target: studentId, steps: JSON.stringify([]), summary: result.summary, status: "done" } });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
