// ============================================================
// 风险分析引擎 - 透明规则驱动，可解释
// ============================================================
import { prisma } from "./db";
import { daysSince } from "./utils";
import type { RiskAnalysisResult, RiskReason } from "@/types";

interface AnalysisInput {
  studentId: string;
  applications: { id: string; status: string; appliedAt: Date; job: { title: string; degreeReq: string; city: string; majorReq: string | null } }[];
  interviews: { id: string; result: string; round: number }[];
  communications: { id: string; date: Date; type: string }[];
  student: {
    id: string;
    employmentStatus: string;
    degreeLevel: string;
    major: { name: string };
    intendedCity: string | null;
    intendedSalary: string | null;
    intendedRole: string | null;
    resumeText: string | null;
    resumeScore: number | null;
    skills: string;
    lastActivityAt: Date | null;
    graduateDate: Date | null;
    financialStatus: string | null;
  };
}

function severityToLevel(reasons: RiskReason[]): "none" | "low" | "medium" | "high" {
  if (reasons.some((r) => r.severity === "high")) return "high";
  if (reasons.some((r) => r.severity === "medium")) return "medium";
  if (reasons.some((r) => r.severity === "low")) return "low";
  return "none";
}

export async function analyzeStudentRisk(studentId: string): Promise<RiskAnalysisResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      major: true,
      applications: { include: { job: true }, orderBy: { appliedAt: "desc" } },
      interviews: { orderBy: { date: "desc" } },
      communications: { orderBy: { date: "desc" } },
    },
  });

  if (!student) throw new Error("学生不存在");

  const input: AnalysisInput = {
    studentId,
    applications: student.applications.map((a) => ({
      id: a.id, status: a.status, appliedAt: a.appliedAt,
      job: { title: a.job.title, degreeReq: a.job.degreeReq, city: a.job.city, majorReq: a.job.majorReq },
    })),
    interviews: student.interviews.map((i) => ({ id: i.id, result: i.result, round: i.round })),
    communications: student.communications.map((c) => ({ id: c.id, date: c.date, type: c.type })),
    student: {
      id: student.id, employmentStatus: student.employmentStatus, degreeLevel: student.degreeLevel,
      major: student.major,
      intendedCity: student.intendedCity, intendedSalary: student.intendedSalary, intendedRole: student.intendedRole,
      resumeText: student.resumeText, resumeScore: student.resumeScore, skills: student.skills,
      lastActivityAt: student.lastActivityAt, graduateDate: student.graduateDate, financialStatus: student.financialStatus,
    },
  };

  return runRiskRules(input);
}

export function runRiskRules(input: AnalysisInput): RiskAnalysisResult {
  const reasons: RiskReason[] = [];
  const missingInfo: string[] = [];
  const s = input.student;

  // 已落实去向的不做风险分析
  if (s.employmentStatus !== "unplaced") {
    return {
      studentId: input.studentId, riskLevel: "none", reasons: [], missingInfo: [],
      analyzedAt: new Date().toISOString(),
    };
  }

  // 规则1：连续30天/60天没有投递
  const lastApp = input.applications[0];
  const lastAppDays = lastApp ? daysSince(lastApp.appliedAt) : null;
  if (lastAppDays === null) {
    if (s.lastActivityAt) {
      const d = daysSince(s.lastActivityAt);
      if (d !== null && d >= 60) {
        reasons.push({
          rule: "no_application_60d", ruleLabel: "连续60天无投递记录", severity: "high",
          data: `最近一次求职活动：${d}天前`, suggestion: "优先人工介入，安排辅导员直接联系学生",
          needsApproval: true,
        });
      } else if (d !== null && d >= 30) {
        reasons.push({
          rule: "no_application_30d", ruleLabel: "连续30天无投递记录", severity: "medium",
          data: `最近一次求职活动：${d}天前`, suggestion: "联系学生了解情况，督促投递",
          needsApproval: false,
        });
      }
    } else {
      missingInfo.push("缺少求职活动时间记录");
      reasons.push({
        rule: "no_activity", ruleLabel: "无任何求职活动记录", severity: "high",
        data: "系统中无投递记录和求职活动时间", suggestion: "优先人工联系确认学生当前状态",
        needsApproval: true,
      });
    }
  } else {
    if (lastAppDays !== null && lastAppDays >= 60) {
      reasons.push({
        rule: "no_application_60d", ruleLabel: "连续60天无投递记录", severity: "high",
        data: `最近一次投递：${lastAppDays}天前，投递岗位：${lastApp.job.title}`,
        suggestion: "高风险，优先人工介入，了解学生是否遇到困难", needsApproval: true,
      });
    } else if (lastAppDays !== null && lastAppDays >= 30) {
      reasons.push({
        rule: "no_application_30d", ruleLabel: "连续30天无投递记录", severity: "medium",
        data: `最近一次投递：${lastAppDays}天前`, suggestion: "联系学生了解求职进展，督促投递",
        needsApproval: false,
      });
    }
  }

  // 规则2：投递超过15次但没有面试
  const appCount = input.applications.length;
  const interviewCount = input.interviews.length;
  if (appCount >= 15 && interviewCount === 0) {
    reasons.push({
      rule: "many_apps_no_interview", ruleLabel: "投递超过15次但无面试机会", severity: "high",
      data: `投递${appCount}次，面试0次，转化率0%`,
      suggestion: "检查岗位匹配度或简历问题，建议简历优化和目标岗位调整", needsApproval: true,
    });
  } else if (appCount >= 10 && interviewCount === 0) {
    reasons.push({
      rule: "moderate_apps_no_interview", ruleLabel: "投递较多但无面试", severity: "medium",
      data: `投递${appCount}次，面试0次`,
      suggestion: "分析投递方向是否偏差，建议简历诊断", needsApproval: false,
    });
  }

  // 规则3：多次面试但无录用
  if (interviewCount >= 3 && !input.applications.some((a) => a.status === "offered")) {
    reasons.push({
      rule: "many_interviews_no_offer", ruleLabel: "多次面试但未获录用", severity: "medium",
      data: `面试${interviewCount}次，均未通过`,
      suggestion: "建议安排模拟面试，提升面试表现", needsApproval: false,
    });
  }

  // 规则4：目标岗位与学历不匹配（案例A）
  if (s.degreeLevel === "bachelor") {
    const masterJobs = input.applications.filter((a) => a.job.degreeReq === "master");
    if (masterJobs.length >= 5) {
      reasons.push({
        rule: "degree_mismatch", ruleLabel: "投递岗位学历要求与自身不匹配", severity: "high",
        data: `本科学历，但${masterJobs.length}次投递要求硕士学历的岗位（如${masterJobs[0].job.title}）`,
        suggestion: "调整求职目标，优先投递学历匹配的岗位", needsApproval: true,
      });
    }
  }

  // 规则5：目标岗位与专业/技能不匹配（案例D）
  const skills: string[] = (() => { try { return JSON.parse(s.skills); } catch { return []; } })();
  if (s.intendedRole && s.major) {
    const majorName = s.major.name;
    const role = s.intendedRole;
    // 网络工程专业投产品经理
    if (majorName.includes("网络工程") && role.includes("产品经理")) {
      const netSkills = skills.filter((k) => /网络|安全|运维|Linux|服务器|路由|交换/i.test(k));
      if (netSkills.length >= 2) {
        reasons.push({
          rule: "target_mismatch", ruleLabel: "求职目标与专业技能不匹配", severity: "medium",
          data: `专业：${majorName}，目标岗位：${role}，但技能更匹配：${netSkills.join("、")}`,
          suggestion: "建议考虑网络安全、运维或技术支持方向，或补充产品相关技能", needsApproval: false,
        });
      }
    }
  }

  // 规则6：薪资期望过窄或偏高
  if (s.intendedSalary) {
    const match = s.intendedSalary.match(/(\d+)k?-(\d+)k?/i);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      if (max - min <= 2 && min >= 10) {
        reasons.push({
          rule: "narrow_salary", ruleLabel: "薪资范围过窄", severity: "low",
          data: `期望薪资：${s.intendedSalary}，范围仅${max - min}k`,
          suggestion: "建议适当放宽薪资范围，增加可投递岗位数量", needsApproval: false,
        });
      }
    }
  }

  // 规则7：简历评分过低
  if (s.resumeScore !== null && s.resumeScore < 50) {
    reasons.push({
      rule: "weak_resume", ruleLabel: "简历表达不足", severity: "medium",
      data: `简历评分：${s.resumeScore}/100`,
      suggestion: "建议简历优化，补充项目经历和技能描述", needsApproval: false,
    });
  } else if (!s.resumeText || s.resumeText.length < 50) {
    missingInfo.push("简历内容不完整");
    reasons.push({
      rule: "incomplete_resume", ruleLabel: "简历内容缺失", severity: "low",
      data: "简历内容过少或为空", suggestion: "督促学生完善简历信息", needsApproval: false,
    });
  }

  // 规则8：临近毕业仍无求职活动
  if (s.graduateDate) {
    const daysToGrad = Math.floor((s.graduateDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysToGrad < 60 && daysToGrad > 0 && appCount < 3) {
      reasons.push({
        rule: "near_grad_no_activity", ruleLabel: "临近毕业且求职活动不足", severity: "high",
        data: `距毕业约${daysToGrad}天，投递仅${appCount}次`,
        suggestion: "优先人工联系，制定紧急求职计划", needsApproval: true,
      });
    }
  }

  // 规则9：有录用记录但状态仍为未落实（案例F - 数据异常）
  if (input.applications.some((a) => a.status === "offered")) {
    reasons.push({
      rule: "data_anomaly_offered", ruleLabel: "数据异常：已有录用但状态仍为未落实", severity: "high",
      data: "存在offered状态的投递记录，但学生就业状态仍为unplaced",
      suggestion: "需人工核实并更新就业状态", needsApproval: true,
    });
  }

  // 规则10：经济困难优先级提升（不改变风险评价）
  if (s.financialStatus === "poverty" || s.financialStatus === "difficulty") {
    // 不增加风险等级，但在建议中提示优先服务
    if (reasons.length > 0) {
      reasons.push({
        rule: "priority_financial", ruleLabel: "家庭经济困难，建议优先服务", severity: "low",
        data: `经济情况：${s.financialStatus}`,
        suggestion: "该生存在就业困难且经济条件有限，建议优先安排帮扶资源", needsApproval: false,
      });
    }
  }

  return {
    studentId: input.studentId,
    riskLevel: severityToLevel(reasons),
    reasons,
    missingInfo,
    analyzedAt: new Date().toISOString(),
  };
}

// 批量分析
export async function analyzeBatch(studentIds: string[]): Promise<RiskAnalysisResult[]> {
  const results: RiskAnalysisResult[] = [];
  for (const id of studentIds) {
    try {
      const r = await analyzeStudentRisk(id);
      results.push(r);
      // 更新数据库
      await prisma.student.update({
        where: { id },
        data: {
          riskLevel: r.riskLevel,
          riskReasons: JSON.stringify(r.reasons),
          riskAnalyzedAt: new Date(),
        },
      });
    } catch (e) {
      console.error(`分析学生 ${id} 失败:`, e);
    }
  }
  return results;
}
