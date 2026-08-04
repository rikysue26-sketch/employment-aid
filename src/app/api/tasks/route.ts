import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId") || "";
  const status = searchParams.get("status") || "";
  const collegeId = searchParams.get("collegeId") || "";

  const where: any = {};
  if (ownerId) where.ownerId = ownerId;
  if (status) where.status = status;
  if (collegeId) where.student = { collegeId };

  const tasks = await prisma.task.findMany({
    where, include: { student: { include: { major: true } }, owner: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tasks: tasks.map((t) => ({ ...t, followUps: t.followUps ? JSON.parse(t.followUps) : [] })) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "create") {
    const { studentId, ownerId, type, priority, deadline, action: taskAction, acceptance } = body;
    const task = await prisma.task.create({
      data: { studentId, ownerId, type, priority, deadline: deadline ? new Date(deadline) : null, action: taskAction, acceptance, status: "pending", followUps: JSON.stringify([]) },
      include: { student: true, owner: true },
    });
    return NextResponse.json({ success: true, task });
  }

  if (action === "update-status") {
    const { taskId, status } = body;
    const task = await prisma.task.update({ where: { id: taskId }, data: { status } });
    return NextResponse.json({ success: true, task });
  }

  if (action === "add-followup") {
    const { taskId, content } = body;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    const followUps = task.followUps ? JSON.parse(task.followUps) : [];
    followUps.push({ content, date: new Date().toISOString() });
    const updated = await prisma.task.update({ where: { id: taskId }, data: { followUps: JSON.stringify(followUps), status: "in_progress" } });
    return NextResponse.json({ success: true, task: { ...updated, followUps } });
  }

  if (action === "batch-create") {
    const { tasks } = body;
    const created = [];
    for (const t of tasks) {
      const task = await prisma.task.create({
        data: { studentId: t.studentId, ownerId: t.ownerId, type: t.type, priority: t.priority || "medium", deadline: t.deadline ? new Date(t.deadline) : null, action: t.action, acceptance: t.acceptance || null, status: "pending", followUps: JSON.stringify([]) },
      });
      created.push(task);
    }
    return NextResponse.json({ success: true, count: created.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
