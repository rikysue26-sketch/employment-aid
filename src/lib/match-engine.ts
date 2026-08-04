// ============================================================
// 人岗匹配引擎 - 两层匹配：硬性条件 + 软性匹配
// ============================================================
import { prisma } from "./db";
import type { MatchResult, HardCheckItem, SoftMatchItem } from "@/types";

function parseSkills(s: string): string[] {
  try { return JSON.parse(s) as string[]; } catch { return []; }
}

function parseMajorReq(s: string | null): string[] {
  if (!s) return [];
  return s.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
}

function degreeRank(d: string): number {
  return { bachelor: 1, master: 2, doctor: 3 }[d] ?? 0;
}

export async function matchStudentToJobs(studentId: string, topN = 10): Promise<MatchResult[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      major: true,
      applications: { include: { job: true } },
      interviews: true,
    },
  });
  if (!student) throw new Error("学生不存在");

  const jobs = await prisma.job.findMany({
    where: { status: "open" },
    include: { enterprise: true },
    orderBy: { createdAt: "desc" },
  });

  const results: MatchResult[] = [];
  const studentSkills = parseSkills(student.skills);

  for (const job of jobs) {
    const r = matchSingle(student, job, studentSkills);
    results.push(r);
  }

  // 排序：硬性通过优先，然后按匹配度
  results.sort((a, b) => {
    if (a.hardPass !== b.hardPass) return a.hardPass ? -1 : 1;
    return b.matchScore - a.matchScore;
  });

  return results.slice(0, topN);
}

function matchSingle(
  student: {
    degreeLevel: string; major: { name: string }; intendedCity: string | null;
    intendedSalary: string | null; intendedRole: string | null; industryPref: string | null;
    resumeText: string | null; skills: string; applications: any[]; interviews: any[];
  },
  job: {
    id: string; title: string; city: string; degreeReq: string; majorReq: string | null;
    skillReq: string | null; salaryRange: string | null; deadline: Date | null;
    headcount: number; status: string; certReq: string | null; enterprise: { name: string; industry: string | null };
  },
  studentSkills: string[]
): MatchResult {
  // === 第一层：硬性条件检查 ===
  const hardChecks: HardCheckItem[] = [];

  // 学历
  const studentDegRank = degreeRank(student.degreeLevel);
  const jobDegRank = degreeRank(job.degreeReq);
  hardChecks.push({
    item: "degree", label: "学历要求",
    passed: studentDegRank >= jobDegRank,
    detail: `岗位要求：${job.degreeReq}，学生学历：${student.degreeLevel}`,
  });

  // 专业
  const majorReqs = parseMajorReq(job.majorReq);
  if (majorReqs.length > 0) {
    const matched = majorReqs.some((m) => student.major.name.includes(m) || m.includes(student.major.name));
    hardChecks.push({
      item: "major", label: "专业要求",
      passed: matched,
      detail: `岗位要求：${majorReqs.join("或")}，学生专业：${student.major.name}`,
    });
  } else {
    hardChecks.push({ item: "major", label: "专业要求", passed: true, detail: "岗位无专业限制" });
  }

  // 招聘截止日期
  if (job.deadline) {
    const passed = job.deadline.getTime() > Date.now();
    hardChecks.push({
      item: "deadline", label: "招聘截止日期",
      passed,
      detail: passed ? `截止日期：${job.deadline.toLocaleDateString("zh-CN")}` : `已过期：${job.deadline.toLocaleDateString("zh-CN")}`,
    });
  } else {
    hardChecks.push({ item: "deadline", label: "招聘截止日期", passed: true, detail: "无截止日期限制" });
  }

  // 工作城市接受度
  if (student.intendedCity) {
    const intendedCities = student.intendedCity.split(/[,，]/).map((c) => c.trim());
    const cityMatched = intendedCities.some((c) => job.city.includes(c) || c.includes(job.city) || c === "不限");
    hardChecks.push({
      item: "city", label: "工作城市",
      passed: cityMatched,
      detail: `学生意向城市：${student.intendedCity}，岗位城市：${job.city}`,
    });
  } else {
    hardChecks.push({ item: "city", label: "工作城市", passed: true, detail: "学生未设定城市限制" });
  }

  // 岗位状态
  hardChecks.push({
    item: "status", label: "岗位状态",
    passed: job.status === "open",
    detail: `岗位状态：${job.status === "open" ? "开放招聘" : "已关闭"}`,
  });

  const hardPass = hardChecks.every((c) => c.passed);

  // === 第二层：软性匹配 ===
  const matchedItems: SoftMatchItem[] = [];
  const unmatchedItems: SoftMatchItem[] = [];
  let softScore = 0;
  let softTotal = 0;

  // 技能匹配
  const jobSkills = parseSkills(job.skillReq || "[]");
  if (jobSkills.length > 0) {
    softTotal += 30;
    const matchedSkills = jobSkills.filter((js) => studentSkills.some((ss) => ss.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(ss.toLowerCase())));
    const score = Math.round((matchedSkills.length / jobSkills.length) * 30);
    softScore += score;
    if (matchedSkills.length === jobSkills.length) {
      matchedItems.push({ item: "skills", label: "技能匹配", matched: true, detail: `全部匹配：${matchedSkills.join("、")}` });
    } else if (matchedSkills.length > 0) {
      matchedItems.push({ item: "skills", label: "技能部分匹配", matched: true, detail: `匹配${matchedSkills.length}/${jobSkills.length}：${matchedSkills.join("、")}` });
      unmatchedItems.push({ item: "skills", label: "缺失技能", matched: false, detail: `缺少：${jobSkills.filter((js) => !matchedSkills.includes(js)).join("、")}` });
    } else {
      unmatchedItems.push({ item: "skills", label: "技能不匹配", matched: false, detail: `岗位要求：${jobSkills.join("、")}，学生暂无相关技能` });
    }
  }

  // 求职意向匹配
  if (student.intendedRole) {
    softTotal += 20;
    const roleMatched = job.title.includes(student.intendedRole) || student.intendedRole.includes(job.title);
    if (roleMatched) { softScore += 20; matchedItems.push({ item: "role", label: "求职意向匹配", matched: true, detail: `学生意向：${student.intendedRole}，岗位：${job.title}` }); }
    else { unmatchedItems.push({ item: "role", label: "求职意向不匹配", matched: false, detail: `学生意向：${student.intendedRole}，岗位：${job.title}` }); }
  }

  // 行业偏好
  if (student.industryPref && job.enterprise.industry) {
    softTotal += 10;
    if (job.enterprise.industry.includes(student.industryPref) || student.industryPref.includes(job.enterprise.industry)) {
      softScore += 10; matchedItems.push({ item: "industry", label: "行业偏好匹配", matched: true, detail: `偏好行业：${student.industryPref}` });
    } else { unmatchedItems.push({ item: "industry", label: "行业偏好不匹配", matched: false, detail: `偏好：${student.industryPref}，岗位行业：${job.enterprise.industry}` }); }
  }

  // 薪资期望
  if (student.intendedSalary && job.salaryRange) {
    softTotal += 15;
    const sMatch = student.intendedSalary.match(/(\d+)k?-(\d+)k?/i);
    const jMatch = job.salaryRange.match(/(\d+)k?-(\d+)k?/i);
    if (sMatch && jMatch) {
      const sMin = parseInt(sMatch[1]), sMax = parseInt(sMatch[2]);
      const jMin = parseInt(jMatch[1]), jMax = parseInt(jMatch[2]);
      const overlap = sMax >= jMin && jMax >= sMin;
      if (overlap) { softScore += 15; matchedItems.push({ item: "salary", label: "薪资期望匹配", matched: true, detail: `期望：${student.intendedSalary}，岗位：${job.salaryRange}` }); }
      else { unmatchedItems.push({ item: "salary", label: "薪资期望不匹配", matched: false, detail: `期望：${student.intendedSalary}，岗位：${job.salaryRange}` }); }
    }
  }

  // 简历相关度（简单关键词匹配）
  if (student.resumeText) {
    softTotal += 15;
    const resumeLower = student.resumeText.toLowerCase();
    const titleWords = job.title.split(/\s+/).filter((w) => w.length >= 2);
    const matched = titleWords.filter((w) => resumeLower.includes(w.toLowerCase()));
    if (matched.length > 0) { softScore += Math.round((matched.length / titleWords.length) * 15); matchedItems.push({ item: "resume", label: "简历相关度", matched: true, detail: `简历包含岗位关键词：${matched.join("、")}` }); }
    else { unmatchedItems.push({ item: "resume", label: "简历相关度低", matched: false, detail: "简历中未包含岗位相关关键词" }); }
  }

  // 可迁移能力（实习/项目经历）
  if (student.applications.length > 0) {
    softTotal += 10;
    const relatedApps = student.applications.filter((a) => a.job.title.includes(job.title) || job.title.includes(a.job.title));
    if (relatedApps.length > 0) { softScore += 10; matchedItems.push({ item: "transferable", label: "相关投递经历", matched: true, detail: `曾投递类似岗位${relatedApps.length}次` }); }
  }

  const finalSoftScore = softTotal > 0 ? Math.round((softScore / softTotal) * 100) : 50;
  const matchScore = hardPass ? finalSoftScore : Math.round(finalSoftScore * 0.4);

  // 生成推荐原因
  const reasonParts: string[] = [];
  if (hardPass) reasonParts.push("硬性条件全部满足");
  if (matchedItems.length > 0) reasonParts.push(matchedItems.map((m) => m.label).join("、"));
  if (!hardPass) {
    const failed = hardChecks.filter((c) => !c.passed).map((c) => c.label);
    reasonParts.push(`硬性条件不满足：${failed.join("、")}`);
  }

  // 能力缺口
  const gaps: string[] = [];
  unmatchedItems.forEach((u) => gaps.push(`${u.label}：${u.detail}`));

  return {
    jobId: job.id,
    matchScore,
    hardPass,
    hardChecks,
    matchedItems,
    unmatchedItems,
    reason: reasonParts.join("；") || "无匹配信息",
    gaps,
    suggestApply: hardPass && matchScore >= 40,
  };
}
