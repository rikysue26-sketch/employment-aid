import { NextResponse } from "next/server";
import { prisma, resolveCollegeId } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const collegeName = searchParams.get("collegeId");
  const collegeId = await resolveCollegeId(collegeName);

  const where = collegeId ? { collegeId } : {};
  
  // Single query: get all students with needed fields
  const students = await prisma.student.findMany({
    where,
    select: { id: true, employmentStatus: true, riskLevel: true, riskReasons: true, inHelpList: true, collegeId: true },
  });
  const total = students.length;
  const employed = students.filter((s) => s.employmentStatus !== "unplaced").length;
  const unplaced = students.filter((s) => s.employmentStatus === "unplaced").length;
  const helpCount = students.filter((s) => s.inHelpList).length;

  // 本周新增 - single query each
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [weekApps, weekInterviews, weekOffers] = await Promise.all([
    prisma.application.count({ where: { appliedAt: { gte: weekAgo }, student: where } }),
    prisma.interview.count({ where: { date: { gte: weekAgo }, student: where } }),
    prisma.application.count({ where: { status: "offered", updatedAt: { gte: weekAgo }, student: where } }),
  ]);

  // 学院进展 - single query with groupBy
  const colleges = await prisma.college.findMany({ include: { students: { select: { employmentStatus: true, riskLevel: true } } } });
  const collegeProgress = colleges.map((c) => {
    const cTotal = c.students.length;
    const cPlaced = c.students.filter((s) => s.employmentStatus !== "unplaced").length;
    return { name: c.name, total: cTotal, placed: cPlaced, rate: cTotal > 0 ? Math.round((cPlaced / cTotal) * 100) : 0 };
  });

  // 最近八周趋势 - single query with groupBy instead of 8 separate queries
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 86400000);
  const appsByWeek = await prisma.application.findMany({
    where: { appliedAt: { gte: eightWeeksAgo } },
    select: { appliedAt: true },
  });
  const trend: { week: string; placed: number; apps: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(Date.now() - i * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    const apps = appsByWeek.filter((a) => a.appliedAt >= weekStart && a.appliedAt < weekEnd).length;
    trend.push({ week: weekLabel, placed: 0, apps });
  }

  // 风险分布 - computed from already fetched students
  const riskDist = {
    high: students.filter((s) => s.riskLevel === "high").length,
    medium: students.filter((s) => s.riskLevel === "medium").length,
    low: students.filter((s) => s.riskLevel === "low").length,
    none: students.filter((s) => s.riskLevel === "none").length,
  };

  // 求职障碍分布
  const obstacleMap: Record<string, number> = {};
  for (const s of students) {
    if (s.riskReasons) {
      try {
        const reasons = JSON.parse(s.riskReasons);
        for (const r of reasons) {
          obstacleMap[r.ruleLabel] = (obstacleMap[r.ruleLabel] || 0) + 1;
        }
      } catch {}
    }
  }
  const obstacles = Object.entries(obstacleMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  // 最近Agent日志
  const agentLogs = await prisma.agentLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } });

  return NextResponse.json({
    stats: { total, employed, unplaced, rate: total > 0 ? Math.round((employed / total) * 100) : 0, helpCount, weekApps, weekInterviews, weekOffers },
    collegeProgress, trend, riskDist, obstacles, agentLogs,
  });
}
