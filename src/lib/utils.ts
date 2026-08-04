import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function daysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function parseJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export const statusLabels: Record<string, string> = {
  unplaced: "未落实去向",
  employed: "已就业",
  postgrad: "升学",
  military: "入伍",
  entrepreneurship: "自主创业",
  abroad: "出国",
};

export const riskLabels: Record<string, string> = {
  none: "无风险",
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

export const riskColors: Record<string, string> = {
  none: "text-gray-600 bg-gray-100",
  low: "text-yellow-700 bg-yellow-100",
  medium: "text-orange-700 bg-orange-100",
  high: "text-red-700 bg-red-100",
};

export const activityLabels: Record<string, string> = {
  active: "活跃",
  normal: "正常",
  inactive: "不活跃",
  silent: "沉默",
};

export const taskTypeLabels: Record<string, string> = {
  interview: "一对一面谈",
  resume: "简历优化",
  recommend: "岗位推荐",
  mock_interview: "模拟面试",
  goal_adjust: "求职目标调整",
  follow_up: "投递结果跟进",
  psych: "心理支持转介",
  other: "其他",
};

export const taskStatusLabels: Record<string, string> = {
  pending: "待处理",
  in_progress: "进行中",
  done: "已完成",
  cancelled: "已取消",
};

export const priorityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急",
};

export const priorityColors: Record<string, string> = {
  low: "text-gray-600 bg-gray-100",
  medium: "text-blue-700 bg-blue-100",
  high: "text-orange-700 bg-orange-100",
  urgent: "text-red-700 bg-red-100",
};
