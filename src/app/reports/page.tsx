"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardBody, Button, Loading, EmptyState, useToast } from "@/components/ui";
import { useRouter } from "next/navigation";

const reportTypes = [
  { type: "weekly", label: "学院就业工作周报", desc: "全面汇总本周就业数据、风险概况和帮扶进展" },
  { type: "leader-summary", label: "学院领导一页摘要", desc: "核心指标和需关注事项的精简摘要" },
  { type: "help-progress", label: "重点帮扶学生进展报告", desc: "重点帮扶学生的跟进状态和优先级" },
  { type: "supply-demand", label: "岗位供需分析", desc: "在招岗位分布和投递情况分析" },
  { type: "task-completion", label: "辅导员任务完成情况", desc: "帮扶任务的完成率和辅导员工作量" },
];

export default function ReportsPage() {
  const { user } = useRole();
  const router = useRouter();
  const [activeType, setActiveType] = useState("weekly");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const { show, ToastEl } = useToast();

  const generate = async (type: string) => {
    setActiveType(type);
    setLoading(true);
    const params = new URLSearchParams({ type });
    if (user?.collegeName) params.set("collegeId", user.collegeName);
    const res = await fetch(`/api/reports?${params}`);
    const data = await res.json();
    setMarkdown(data.markdown || "");
    setLoading(false);
  };

  useEffect(() => { if (user) generate("weekly"); }, [user]);

  const copy = () => {
    navigator.clipboard.writeText(markdown);
    show("success", "已复制到剪贴板");
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeType}-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">报告中心</h1>

        {/* 报告类型选择 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {reportTypes.map((r) => (
            <Card key={r.type} className={`cursor-pointer transition-all ${activeType === r.type ? "border-brand-400 border-2" : "hover:border-gray-300"}`}>
              <CardBody onClick={() => generate(r.type)}>
                <h3 className="text-sm font-semibold text-gray-700">{r.label}</h3>
                <p className="text-xs text-gray-400 mt-1">{r.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* 报告预览 */}
        <Card>
          <CardHeader
            title={reportTypes.find((r) => r.type === activeType)?.label || "报告"}
            subtitle="基于系统当前数据动态生成"
            action={
              <div className="flex gap-2 no-print">
                <Button variant="outline" size="sm" onClick={copy}>复制内容</Button>
                <Button variant="outline" size="sm" onClick={download}>导出Markdown</Button>
                <Button variant="primary" size="sm" onClick={() => window.print()}>打印/PDF</Button>
              </div>
            }
          />
          <CardBody>
            {loading ? <Loading text="生成报告中..." /> : markdown ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{markdown}</pre>
              </div>
            ) : <EmptyState title="暂无报告" />}
          </CardBody>
        </Card>
      </div>
      {ToastEl}
    </AppShell>
  );
}
