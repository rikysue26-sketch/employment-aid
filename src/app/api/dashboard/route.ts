import { NextResponse } from "next/server";
import { prisma, resolveCollegeId } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const collegeName = searchParams.get("collegeId");
  const collegeId = await resolveCollegeId(collegeName);

  const where = collegeId ? { collegeId } : {};
  const students = await prisma.student.findMany({ where, include: { major: true, college: true } });
  const total = students.length;
  const employed = students.filter((s) => ["employed", "postgrad", "military", "entrepreneurship", "abroad"].includes(s.employmentStatus)).length;
  const unplaced = students.filter((s) => s.employmentStatus === "unplaced").length;
  const helpCount = students.filter((s) => s.inHelpList).length;

  // 本周新增
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const weekApps = await prisma.application.count({ where: { appliedAt: { gte: weekAgo }, student: where } });
  const weekInterviews = await prisma.interview.count({ where: { date: { gte: weekAgo }, student: where } });
  const weekOffers = await prisma.application.count({ where: { status: "offered", updatedAt: { gte: weekAgo }, student: where } });

  // 学院进展
  const colleges = await prisma.college.findMany({ include: { students: true } });
  const collegeProgress = colleges.map((c) => {
    const total = c.students.length;
    const placed = c.students.filter((s) => s.employmentStatus !== "unplaced").length;
    return { name: c.name, total, placed, rate: total > 0 ? Math.round((placed / total) * 100) : 0 };
  });

  // 最近八周趋势
  const trend: { week: string; placed: number; apps: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(Date.now() - i * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    const apps = await prisma.application.count({ where: { appliedAt: { gte: weekStart, lt: weekEnd } } });
    trend.push({ week: weekLabel, placed: 0, apps });
  }

  // 风险分布
  const riskDist = {
    high: students.filter((s) => s.riskLevel === "high").length,
    medium: students.filter((s) => s.riskLevel === "medium").length,
    low: students.filter((s) => s.riskLevel === "low").length,
    none: students.filter((s) => s.riskLevel === "none").length,
  };

  // 求职障碍分布（从风险原因中统计）
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
