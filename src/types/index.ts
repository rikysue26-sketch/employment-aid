// 风险分析结果类型
export interface RiskReason {
  rule: string;
  ruleLabel: string;
  severity: "low" | "medium" | "high";
  data: string;        // 数据依据
  suggestion: string;  // 建议行动
  needsApproval: boolean;
}

export interface RiskAnalysisResult {
  studentId: string;
  riskLevel: "none" | "low" | "medium" | "high";
  reasons: RiskReason[];
  missingInfo: string[];
  analyzedAt: string;
}

// 人岗匹配结果类型
export interface HardCheckItem {
  item: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SoftMatchItem {
  item: string;
  label: string;
  matched: boolean;
  detail: string;
}

export interface MatchResult {
  jobId: string;
  matchScore: number;
  hardPass: boolean;
  hardChecks: HardCheckItem[];
  matchedItems: SoftMatchItem[];
  unmatchedItems: SoftMatchItem[];
  reason: string;
  gaps: string[];
  suggestApply: boolean;
}

// Agent步骤类型
export interface AgentStep {
  step: number;
  title: string;
  status: "pending" | "running" | "done" | "skipped";
  detail?: string;
  dataRead?: string[];
  findings?: string[];
  needsApproval?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
}

// Agent结论类型
export interface AgentConclusion {
  category: "fact" | "computed" | "inference" | "missing" | "approval_needed";
  label: string;
  content: string;
}

// 角色类型
export interface RoleUser {
  id: string;
  name: string;
  role: "admin" | "counselor" | "leader";
  collegeId: string | null;
  collegeName: string | null;
}

// 演示案例标记
export type DemoCase = "A" | "B" | "C" | "D" | "E" | "F";
