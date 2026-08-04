import { NextRequest, NextResponse } from "next/server";
import { prisma, resolveCollegeId } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "weekly";
  const collegeName = searchParams.get("collegeId") || "";
  const collegeId = await resolveCollegeId(collegeName);

  const where = collegeId ? { collegeId } : {};
  const students = await prisma.student.findMany({ where, include: { major: true, college: true, tasks: true, communications: true } });
  const tasks = await prisma.task.findMany({ where: { student: where }, include: { student: true, owner: true } });
  const jobs = await prisma.job.findMany({ include: { enterprise: true, applications: true } });

  const total = students.length;
  const employed = students.filter((s) => s.employmentStatus !== "unplaced").length;
  const unplaced = students.filter((s) => s.employmentStatus === "unplaced").length;
  const highRisk = students.filter((s) => s.riskLevel === "high").length;
  const mediumRisk = students.filter((s) => s.riskLevel === "medium").length;
  const helpList = students.filter((s) => s.inHelpList && s.helpListStatus === "confirmed").length;
  const rate = total > 0 ? Math.round((employed / total) * 100) : 0;

  const taskDone = tasks.filter((t) => t.status === "done").length;
  const taskPending = tasks.filter((t) => t.status === "pending").length;
  const taskInProgress = tasks.filter((t) => t.status === "in_progress").length;

  // 学院数据
  const colleges = await prisma.college.findMany({ include: { students: true } });
  const collegeData = colleges.map((c) => {
    const cTotal = c.students.length;
    const cPlaced = c.students.filter((s) => s.employmentStatus !== "unplaced").length;
    const cHigh = c.students.filter((s) => s.riskLevel === "high").length;
    return { name: c.name, total: cTotal, placed: cPlaced, rate: cTotal > 0 ? Math.round((cPlaced / cTotal) * 100) : 0, highRisk: cHigh };
  });

  // 岗位供需
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const totalApps = jobs.reduce((sum: number, j: any) => sum + j.applications.length, 0);

  if (type === "weekly") {
    const md = generateWeeklyReport({ total, employed, unplaced, rate, highRisk, mediumRisk, helpList, taskDone, taskPending, taskInProgress, collegeData, collegeName: collegeId ? colleges.find((c) => c.id === collegeId)?.name || "全校" : "全校", openJobs, totalApps });
    return NextResponse.json({ markdown: md });
  }

  if (type === "leader-summary") {
    const md = generateLeaderSummary({ total, employed, unplaced, rate, highRisk, helpList, collegeData, collegeName: collegeId ? colleges.find((c) => c.id === collegeId)?.name || "全校" : "全校" });
    return NextResponse.json({ markdown: md });
  }

  if (type === "help-progress") {
    const helpStudents = students.filter((s) => s.inHelpList);
    const md = generateHelpProgressReport(helpStudents);
    return NextResponse.json({ markdown: md });
  }

  if (type === "supply-demand") {
    const md = generateSupplyDemandReport(jobs, students);
    return NextResponse.json({ markdown: md });
  }

  if (type === "task-completion") {
    const md = generateTaskReport(tasks);
    return NextResponse.json({ markdown: md });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}

function generateWeeklyReport(d: any): string {
  return `# ${d.collegeName}就业工作周报

> 生成时间：${new Date().toLocaleString("zh-CN")}

## 一、就业概况

| 指标 | 数值 |
|------|------|
| 毕业生总数 | ${d.total}人 |
| 已落实去向 | ${d.employed}人 |
| 未落实去向 | ${d.unplaced}人 |
| 就业落实率 | ${d.rate}% |
| 重点帮扶人数 | ${d.helpList}人 |
| 高风险学生 | ${d.highRisk}人 |
| 中风险学生 | ${d.mediumRisk}人 |

## 二、各学院就业进展

| 学院 | 毕业生数 | 已落实 | 落实率 | 高风险 |
|------|----------|--------|--------|--------|
${d.collegeData.map((c: any) => `| ${c.name} | ${c.total} | ${c.placed} | ${c.rate}% | ${c.highRisk} |`).join("\n")}

## 三、帮扶任务完成情况

- 已完成：${d.taskDone}项
- 进行中：${d.taskInProgress}项
- 待处理：${d.taskPending}项
- 完成率：${d.taskDone + d.taskPending + d.taskInProgress > 0 ? Math.round((d.taskDone / (d.taskDone + d.taskPending + d.taskInProgress)) * 100) : 0}%

## 四、岗位供需

- 在招岗位：${d.openJobs}个
- 投递总数：${d.totalApps}次

## 五、下周工作重点

1. 对${d.highRisk}名高风险学生进行一对一联系
2. 推进${d.taskPending}项待处理帮扶任务
3. 持续跟踪重点帮扶学生的求职进展
4. 更新未落实去向学生的就业状态

---
*本报告由系统根据当前数据动态生成，数据截止至生成时间。*
`;
}

function generateLeaderSummary(d: any): string {
  return `# ${d.collegeName}就业工作领导摘要

> 生成时间：${new Date().toLocaleString("zh-CN")}

## 核心指标

- 毕业生总数：**${d.total}人**
- 就业落实率：**${d.rate}%**
- 未落实去向：**${d.unplaced}人**
- 高风险学生：**${d.highRisk}人**
- 重点帮扶：**${d.helpList}人**

## 各学院进展

${d.collegeData.map((c: any) => `- **${c.name}**：落实率${c.rate}%（${c.placed}/${c.total}），高风险${c.highRisk}人`).join("\n")}

## 需关注事项

1. 高风险学生需优先安排辅导员介入
2. 未落实去向学生中存在求职不活跃的情况
3. 建议本周内完成所有重点帮扶学生的跟进

---
*本摘要由系统根据当前数据动态生成。*
`;
}

function generateHelpProgressReport(students: any[]): string {
  return `# 重点帮扶学生进展报告

> 生成时间：${new Date().toLocaleString("zh-CN")}

## 帮扶概况

- 重点帮扶学生总数：${students.length}人
- 已确认：${students.filter((s) => s.helpListStatus === "confirmed").length}人
- 待确认：${students.filter((s) => s.helpListStatus === "pending").length}人

## 学生明细

| 姓名 | 学号 | 风险等级 | 跟进状态 | 优先级 |
|------|------|----------|----------|--------|
${students.map((s) => `| ${s.name} | ${s.studentNo} | ${s.riskLevel} | ${s.helpListStatus} | ${s.helpPriority} |`).join("\n")}

---
*本报告由系统根据当前数据动态生成。*
`;
}

function generateSupplyDemandReport(jobs: any[], students: any[]): string {
  const openJobs = jobs.filter((j) => j.status === "open");
  return `# 岗位供需分析报告

> 生成时间：${new Date().toLocaleString("zh-CN")}

## 岗位概况

- 在招岗位：${openJobs.length}个
- 涉及企业：${new Set(openJobs.map((j) => j.enterpriseId)).size}家
- 投递总数：${jobs.reduce((s: number, j: any) => s + j.applications.length, 0)}次

## 学历要求分布

| 学历要求 | 岗位数 |
|----------|--------|
| 本科 | ${openJobs.filter((j) => j.degreeReq === "bachelor").length} |
| 硕士 | ${openJobs.filter((j) => j.degreeReq === "master").length} |
| 博士 | ${openJobs.filter((j) => j.degreeReq === "doctor").length} |

## 城市分布

${Object.entries(openJobs.reduce((acc: Record<string, number>, j: any) => { acc[j.city] = (acc[j.city] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([city, count]) => `- ${city}：${count}个岗位`).join("\n")}

---
*本报告由系统根据当前数据动态生成。*
`;
}

function generateTaskReport(tasks: any[]): string {
  return `# 辅导员任务完成情况报告

> 生成时间：${new Date().toLocaleString("zh-CN")}

## 任务概况

- 任务总数：${tasks.length}项
- 已完成：${tasks.filter((t) => t.status === "done").length}项
- 进行中：${tasks.filter((t) => t.status === "in_progress").length}项
- 待处理：${tasks.filter((t) => t.status === "pending").length}项

## 按辅导员统计

${Object.entries(tasks.reduce((acc: Record<string, { total: number; done: number }>, t: any) => { const name = t.owner?.name || "未分配"; if (!acc[name]) acc[name] = { total: 0, done: 0 }; acc[name].total++; if (t.status === "done") acc[name].done++; return acc; }, {})).map(([name, d]) => `- **${name}**：${d.done}/${d.total}已完成`).join("\n")}

---
*本报告由系统根据当前数据动态生成。*
`;
}
