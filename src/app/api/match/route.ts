import { NextRequest, NextResponse } from "next/server";
import { matchStudentToJobs } from "@/lib/match-engine";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { studentId, action } = await request.json();

  if (action === "match") {
    const results = await matchStudentToJobs(studentId, 10);
    // 保存到数据库
    for (const r of results) {
      await prisma.recommendation.upsert({
        where: { studentId_jobId: { studentId, jobId: r.jobId } },
        create: {
          studentId, jobId: r.jobId, matchScore: r.matchScore, hardPass: r.hardPass,
          matchedItems: JSON.stringify(r.matchedItems), unmatchedItems: JSON.stringify(r.unmatchedItems),
          hardCheck: JSON.stringify(r.hardChecks), reason: r.reason, gaps: JSON.stringify(r.gaps),
          suggestApply: r.suggestApply, status: "pending",
        },
        update: {
          matchScore: r.matchScore, hardPass: r.hardPass,
          matchedItems: JSON.stringify(r.matchedItems), unmatchedItems: JSON.stringify(r.unmatchedItems),
          hardCheck: JSON.stringify(r.hardChecks), reason: r.reason, gaps: JSON.stringify(r.gaps),
          suggestApply: r.suggestApply,
        },
      });
    }
    return NextResponse.json({ results });
  }

  if (action === "update-rec") {
    const { recId, status, messageDraft, messageStatus } = await request.json();
    const updated = await prisma.recommendation.update({
      where: { id: recId },
      data: { ...(status && { status }), ...(messageDraft !== undefined && { messageDraft }), ...(messageStatus && { messageStatus }) },
    });
    return NextResponse.json({ success: true, rec: updated });
  }

  if (action === "generate-message") {
    const { recId } = await request.json();
    const rec = await prisma.recommendation.findUnique({ where: { id: recId }, include: { job: { include: { enterprise: true } }, student: true } });
    if (!rec) return NextResponse.json({ error: "推荐记录不存在" }, { status: 404 });
    const matched = JSON.parse(rec.matchedItems || "[]");
    const message = `${rec.student.name}同学你好：\n\n根据你的求职意向和技能背景，为你推荐以下岗位：\n\n【${rec.job.title}】-${rec.job.enterprise.name}\n工作城市：${rec.job.city}\n薪资范围：${rec.job.salaryRange || "面议"}\n\n推荐理由：${rec.reason}\n\n建议你尽快投递，如有需要可以找我帮你修改简历或做面试准备。\n\n辅导员`;
    const updated = await prisma.recommendation.update({ where: { id: recId }, data: { messageDraft: message, messageStatus: "draft" } });
    return NextResponse.json({ message, rec: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
