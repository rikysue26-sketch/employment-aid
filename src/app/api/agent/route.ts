import { NextRequest, NextResponse } from "next/server";
import { prisma, resolveCollegeId } from "@/lib/db";
import { runAgentTask, getAIMode } from "@/lib/agent";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const logId = searchParams.get("logId");
  if (logId) {
    const log = await prisma.agentLog.findUnique({ where: { id: logId } });
    if (!log) return NextResponse.json({ error: "日志不存在" }, { status: 404 });
    return NextResponse.json({
      ...log,
      steps: log.steps ? JSON.parse(log.steps) : [],
    });
  }

  const logs = await prisma.agentLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: true } });
  return NextResponse.json({ logs, aiMode: getAIMode() });
}

export async function POST(request: NextRequest) {
  const { instruction, collegeName, userId } = await request.json();
  const collegeId = await resolveCollegeId(collegeName);
  // Validate userId exists, otherwise set to null
  let validUserId = null;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) validUserId = userId;
  }
  const log = await prisma.agentLog.create({
    data: { userId: validUserId, taskType: "agent_task", target: instruction, steps: JSON.stringify([]), status: "running" },
  });

  try {
    const result = await runAgentTask(instruction, collegeId, userId);
    await prisma.agentLog.update({
      where: { id: log.id },
      data: { steps: JSON.stringify(result.steps), summary: result.summary, status: "done" },
    });
    return NextResponse.json({ logId: log.id, ...result });
  } catch (e: any) {
    await prisma.agentLog.update({ where: { id: log.id }, data: { status: "failed", summary: e.message } });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
