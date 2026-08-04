// ============================================================
// Agent 服务层 - Mock 与 Real 双模式
// ============================================================
import { prisma } from "./db";
import { analyzeStudentRisk, runRiskRules } from "./risk-engine";
import { matchStudentToJobs } from "./match-engine";
import type { AgentStep, AgentConclusion } from "@/types";

export function getAIMode(): "mock" | "real" {
  return (process.env.AI_MODE || "mock") as "mock" | "real";
}

// ---------- Mock Agent: 简历优化建议 ----------
export async function mockResumeAdvice(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("学生不存在");
  const skills = JSON.parse(student.skills || "[]");
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!student.resumeText || student.resumeText.length < 100) {
    issues.push("简历内容过短，缺乏详细信息");
    suggestions.push("建议补充项目经历、实习经历和技能描述，将简历扩展到至少一页");
  }
  if (skills.length < 3) {
    issues.push("技能标签数量不足");
    suggestions.push("建议补充与目标岗位相关的技术技能，如编程语言、框架、工具等");
  }
  if (student.resumeText && !/项目|实习|经历/.test(student.resumeText)) {
    issues.push("缺少项目或实习经历描述");
    suggestions.push("建议增加1-2个项目的描述，包括项目背景、个人职责和成果");
  }
  if (!student.intendedRole) {
    issues.push("求职意向不明确");
    suggestions.push("建议明确求职意向，以便针对性优化简历");
  }
  if (issues.length === 0) {
    issues.push("简历整体结构基本完整");
    suggestions.push("建议进一步量化项目成果，突出与目标岗位的匹配度");
  }

  return {
    issues,
    suggestions,
    score: student.resumeScore || 50,
    summary: `简历评估完成，发现${issues.length}个可改进项`,
    conclusions: [
      { category: "fact" as const, label: "简历字数", content: `${student.resumeText?.length || 0}字` },
      { category: "fact" as const, label: "技能数量", content: `${skills.length}个` },
      { category: "computed" as const, label: "简历评分", content: `${student.resumeScore || 50}/100` },
      { category: "inference" as const, label: "改进空间", content: `${issues.length}个可改进项` },
    ] as AgentConclusion[],
  };
}

// ---------- Mock Agent: 沟通提纲 ----------
export async function mockCommOutline(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { major: true, applications: { include: { job: true }, take: 5, orderBy: { appliedAt: "desc" } }, interviews: true },
  });
  if (!student) throw new Error("学生不存在");

  const riskReasons = student.riskReasons ? JSON.parse(student.riskReasons) : [];
  const outline: string[] = [];

  outline.push(`一、开场确认：${student.name}同学，今天联系你是想了解一下你最近的求职进展和遇到的困难。`);
  outline.push(`二、当前状态确认：你目前的就业状态系统记录为"${student.employmentStatus === "unplaced" ? "未落实去向" : "已落实"}"，是否准确？`);

  if (student.applications.length > 0) {
    outline.push(`三、投递情况：你最近投递了${student.applications.length}个岗位，最近投递的是${student.applications[0].job.title}，目前反馈如何？`);
  } else {
    outline.push("三、投递情况：系统中暂无你的投递记录，目前是否在积极求职？是否有投递但未通过系统记录？");
  }

  if (riskReasons.length > 0) {
    outline.push(`四、重点关注：根据系统分析，存在以下需要关注的问题：`);
    riskReasons.slice(0, 3).forEach((r: any, i: number) => {
      outline.push(`  ${i + 1}. ${r.ruleLabel}：${r.suggestion}`);
    });
  }

  outline.push(`五、求职意向：你的目标岗位是${student.intendedRole || "未设定"}，目标城市是${student.intendedCity || "未设定"}，是否需要调整？`);
  outline.push("六、困难与需求：在求职过程中遇到的最大困难是什么？希望学校提供哪些帮助？");
  outline.push("七、下一步计划：我们一起来制定一个近两周的求职行动计划。");

  return {
    outline,
    summary: `已为${student.name}生成沟通提纲，共${outline.length}个要点`,
  };
}

// ---------- Mock Agent: 执行复合任务 ----------
export async function runAgentTask(
  instruction: string,
  collegeId: string | null,
  userId: string | null
): Promise<{ steps: AgentStep[]; conclusions: AgentConclusion[]; summary: string }> {
  const steps: AgentStep[] = [];
  const conclusions: AgentConclusion[] = [];
  let stepNum = 1;

  // Step 1: 读取未就业学生
  steps.push({ step: stepNum++, title: "读取未就业学生数据", status: "running" });
  const students = await prisma.student.findMany({
    where: {
      employmentStatus: "unplaced",
      ...(collegeId ? { collegeId } : {}),
    },
    include: { major: true, applications: { include: { job: true } }, interviews: true, communications: true },
  });
  steps[steps.length - 1].status = "done";
  steps[steps.length - 1].detail = `共读取到${students.length}名未落实去向的学生`;
  steps[steps.length - 1].dataRead = [`${students.length}名学生记录`, `投递记录${students.reduce((s, st) => s + st.applications.length, 0)}条`, `面试记录${students.reduce((s, st) => s + st.interviews.length, 0)}条`];

  conclusions.push({ category: "fact", label: "数据范围", content: `${students.length}名未落实去向学生` });

  // Step 2: 分析求职活跃度
  steps.push({ step: stepNum++, title: "分析求职活跃度", status: "running" });
  const now = Date.now();
  const inactive = students.filter((s) => {
    if (!s.lastActivityAt) return true;
    const days = Math.floor((now - s.lastActivityAt.getTime()) / 86400000);
    return days >= 30;
  });
  steps[steps.length - 1].status = "done";
  steps[steps.length - 1].detail = `活跃${students.length - inactive.length}人，不活跃${inactive.length}人`;
  steps[steps.length - 1].findings = [`${inactive.length}名学生30天以上无求职活动`];

  // Step 3: 检查投递和面试转化
  steps.push({ step: stepNum++, title: "检查投递和面试转化", status: "running" });
  const lowConversion = students.filter((s) => s.applications.length >= 10 && s.interviews.length === 0);
  const manyInterviewsNoOffer = students.filter((s) => s.interviews.length >= 3 && !s.applications.some((a) => a.status === "offered"));
  steps[steps.length - 1].status = "done";
  steps[steps.length - 1].detail = `投递多但无面试${lowConversion.length}人，多次面试无录用${manyInterviewsNoOffer.length}人`;
  steps[steps.length - 1].findings = [`${lowConversion.length}人投递转化率异常`, `${manyInterviewsNoOffer.length}人需面试辅导`];

  // Step 4: 分析求职意向
  steps.push({ step: stepNum++, title: "分析求职意向合理性", status: "running" });
  const targetMismatch = students.filter((s) => {
    if (s.degreeLevel === "bachelor" && s.applications.some((a) => a.job.degreeReq === "master")) return true;
    return false;
  });
  steps[steps.length - 1].status = "done";
  steps[steps.length - 1].detail = `发现${targetMismatch.length}人求职目标与自身条件不匹配`;

  // Step 5: 运行风险分析
  steps.push({ step: stepNum++, title: "运行风险分析引擎", status: "running" });
  const highRisk: typeof students = [];
  const mediumRisk: typeof students = [];
  for (const s of students) {
    const result = runRiskRules({
      studentId: s.id,
      student: {
        id: s.id, employmentStatus: s.employmentStatus, degreeLevel: s.degreeLevel,
        major: s.major, intendedCity: s.intendedCity, intendedSalary: s.intendedSalary,
        intendedRole: s.intendedRole, resumeText: s.resumeText, resumeScore: s.resumeScore,
        skills: s.skills, lastActivityAt: s.lastActivityAt, graduateDate: s.graduateDate,
        financialStatus: s.financialStatus,
      },
      applications: s.applications.map((a) => ({ id: a.id, status: a.status, appliedAt: a.appliedAt, job: { title: a.job.title, degreeReq: a.job.degreeReq, city: a.job.city, majorReq: a.job.majorReq } })),
      interviews: s.interviews.map((i) => ({ id: i.id, result: i.result, round: i.round })),
      communications: s.communications.map((c) => ({ id: c.id, date: c.date, type: c.type })),
    });
    if (result.riskLevel === "high") highRisk.push(s);
    else if (result.riskLevel === "medium") mediumRisk.push(s);
    await prisma.student.update({
      where: { id: s.id },
      data: { riskLevel: result.riskLevel, riskReasons: JSON.stringify(result.reasons), riskAnalyzedAt: new Date() },
    });
  }
  steps[steps.length - 1].status = "done";
  steps[steps.length - 1].detail = `高风险${highRisk.length}人，中风险${mediumRisk.length}人`;
  steps[steps.length - 1].findings = [`高风险${highRisk.length}人需优先帮扶`, `中风险${mediumRisk.length}人需关注`];

  conclusions.push({ category: "computed", label: "风险分布", content: `高风险${highRisk.length}人，中风险${mediumRisk.length}人` });

  // Step 6: 生成重点帮扶建议
  steps.push({ step: stepNum++, title: "生成重点帮扶建议", status: "running" });
  const helpList = [...highRisk, ...mediumRisk].slice(0, 20);
  for (const s of helpList) {
    await prisma.student.update({
      where: { id: s.id },
      data: { helpListStatus: "pending", inHelpList: true, helpListAddedAt: new Date() },
    });
  }
  steps[steps.length - 1].status = "done";
  steps[steps.length - 1].detail = `已生成${helpList.length}人的重点帮扶建议，待辅导员确认`;
  steps[steps.length - 1].needsApproval = true;
  steps[steps.length - 1].approvalStatus = "pending";

  conclusions.push({ category: "approval_needed", label: "待确认事项", content: `${helpList.length}名学生的重点帮扶建议需辅导员确认` });

  // Step 7: 匹配岗位
  steps.push({ step: stepNum++, title: "为高风险学生匹配岗位", status: "running" });
  let matchCount = 0;
  for (const s of highRisk.slice(0, 10)) {
    const matches = await matchStudentToJobs(s.id, 3);
    for (const m of matches.filter((m) => m.hardPass)) {
      await prisma.recommendation.create({
        data: {
          studentId: s.id, jobId: m.jobId, matchScore: m.matchScore, hardPass: m.hardPass,
          matchedItems: JSON.stringify(m.matchedItems), unmatchedItems: JSON.stringify(m.unmatchedItems),
          hardCheck: JSON.stringify(m.hardChecks), reason: m.reason, gaps: JSON.stringify(m.gaps),
          suggestApply: m.suggestApply, status: "pending",
        },
      });
      matchCount++;
    }
  }
  steps[steps.length - 1].status = "done";
  steps[steps.length - 1].detail = `为${Math.min(highRisk.length, 10)}名学生生成了${matchCount}条岗位推荐`;

  // Step 8: 生成帮扶计划
  steps.push({ step: stepNum++, title: "生成两周帮扶计划", status: "running" });
  const planItems: string[] = [];
  for (const s of highRisk.slice(0, 5)) {
    planItems.push(`${s.name}：一对一面谈 + 简历优化`);
  }
  for (const s of manyInterviewsNoOffer.slice(0, 3)) {
    planItems.push(`${s.name}：模拟面试安排`);
  }
  steps[steps.length - 1].status = "done";
  steps[steps.length - 1].detail = `生成${planItems.length}项帮扶计划，待辅导员审批后创建任务`;
  steps[steps.length - 1].needsApproval = true;
  steps[steps.length - 1].approvalStatus = "pending";

  conclusions.push({ category: "inference", label: "帮扶计划", content: `建议为${planItems.length}名学生制定两周帮扶计划` });
  conclusions.push({ category: "approval_needed", label: "待确认", content: "帮扶计划需辅导员审批后自动创建任务" });

  const summary = `分析完成：共分析${students.length}名未落实去向学生，识别高风险${highRisk.length}人、中风险${mediumRisk.length}人，生成${helpList.length}条帮扶建议和${matchCount}条岗位推荐，${planItems.length}项帮扶计划待审批。`;

  return { steps, conclusions, summary };
}

// ---------- Real AI 模式占位 ----------
export async function callRealAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) throw new Error("未配置 OPENAI_API_KEY，请检查 .env 文件");

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });
  if (!resp.ok) throw new Error(`AI调用失败: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}
