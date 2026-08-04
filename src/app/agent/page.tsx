"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardBody, Button, Badge, Loading, EmptyState, useToast } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

const presetTasks = [
  "分析计算机学院所有未落实去向的学生，识别最需要优先帮扶的20人，为每人推荐岗位，并制定未来两周的帮扶计划。",
  "分析通信工程学院未就业学生的投递转化率，找出投递多但无面试的学生。",
  "检查所有学生的就业状态是否存在数据异常（如已录用但状态未更新）。",
];

export default function AgentPage() {
  const { user, isDemoMode } = useRole();
  const [instruction, setInstruction] = useState(presetTasks[0]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [aiMode, setAiMode] = useState("mock");
  const { show, ToastEl } = useToast();

  const fetchLogs = async () => {
    const res = await fetch("/api/agent");
    const data = await res.json();
    setLogs(data.logs || []);
    setAiMode(data.aiMode || "mock");
  };

  useEffect(() => { if (user) fetchLogs(); }, [user]);

  const run = async () => {
    if (!instruction.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, collegeName: user?.collegeName, userId: user?.id }),
      });
      const data = await res.json();
      if (data.error) { show("error", data.error); }
      else { setResult(data); show("success", "Agent任务执行完成"); }
    } catch (e: any) {
      show("error", e.message);
    }
    setRunning(false);
    fetchLogs();
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agent工作台</h1>
          <p className="text-sm text-gray-500 mt-1">
            当前模式：<Badge className={aiMode === "mock" ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}>{aiMode === "mock" ? "Mock Agent（规则引擎）" : "真实AI（OpenAI兼容）"}</Badge>
            <span className="ml-2 text-gray-400">通过 AI_MODE 环境变量切换</span>
          </p>
        </div>

        {/* 任务输入 */}
        <Card>
          <CardHeader title="输入任务指令" subtitle="Agent将自动拆解任务并逐步执行" />
          <CardBody>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="输入Agent任务..."
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {presetTasks.map((t, i) => (
                  <Button key={i} variant="ghost" size="sm" onClick={() => setInstruction(t)}>预设任务{i + 1}</Button>
                ))}
              </div>
              <Button variant="primary" onClick={run} disabled={running || !instruction.trim()}>
                {running ? "执行中..." : "▶ 执行任务"}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* 执行过程 */}
        {running && (
          <Card>
            <CardHeader title="Agent执行中..." />
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-brand-600"></div>
                <span className="text-sm text-gray-500">Agent正在分析数据、运行规则引擎、匹配岗位...</span>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 执行结果 */}
        {result && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="任务拆解与执行步骤" subtitle={`共${result.steps?.length || 0}步`} />
              <CardBody>
                <div className="space-y-3">
                  {result.steps?.map((step: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        step.status === "done" ? "bg-green-100 text-green-700" : step.status === "running" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                      }`}>
                        {step.status === "done" ? "✓" : step.status === "running" ? "…" : step.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-700">步骤{step.step}：{step.title}</p>
                          {step.needsApproval && <Badge className="bg-orange-100 text-orange-700">需审批</Badge>}
                        </div>
                        {step.detail && <p className="text-sm text-gray-500 mt-0.5">{step.detail}</p>}
                        {step.dataRead && step.dataRead.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {step.dataRead.map((d: string, idx: number) => <Badge key={idx} className="bg-gray-100 text-gray-500 text-xs">📊 {d}</Badge>)}
                          </div>
                        )}
                        {step.findings && step.findings.length > 0 && (
                          <div className="mt-1">
                            {step.findings.map((f: string, idx: number) => <p key={idx} className="text-xs text-orange-600">⚠ {f}</p>)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Agent结论 */}
            {result.conclusions && result.conclusions.length > 0 && (
              <Card>
                <CardHeader title="Agent输出结论" subtitle="区分事实、计算结果、推测和待确认事项" />
                <CardBody>
                  <div className="space-y-2">
                    {result.conclusions.map((c: any, i: number) => (
                      <div key={i} className="flex gap-2 items-start">
                        <Badge className={
                          c.category === "fact" ? "bg-blue-100 text-blue-700" :
                          c.category === "computed" ? "bg-purple-100 text-purple-700" :
                          c.category === "inference" ? "bg-orange-100 text-orange-700" :
                          c.category === "missing" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }>
                          {c.category === "fact" ? "已确认事实" : c.category === "computed" ? "系统计算" : c.category === "inference" ? "Agent推测" : c.category === "missing" ? "缺失信息" : "待人工确认"}
                        </Badge>
                        <div className="flex-1">
                          <span className="text-sm text-gray-700"><b>{c.label}：</b>{c.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* 总结 */}
            <Card>
              <CardHeader title="执行总结" />
              <CardBody>
                <p className="text-sm text-gray-600">{result.summary}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => window.location.href = "/help-center"}>查看重点帮扶中心</Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = "/tasks"}>查看帮扶任务</Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = "/reports"}>生成周报</Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* 历史日志 */}
        <Card>
          <CardHeader title="Agent操作日志" subtitle="最近20条" />
          <CardBody>
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge className={log.status === "done" ? "bg-green-100 text-green-700" : log.status === "running" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}>
                        {log.status === "done" ? "完成" : log.status === "running" ? "运行中" : "失败"}
                      </Badge>
                      <div>
                        <p className="text-sm text-gray-700">{log.taskType}</p>
                        <p className="text-xs text-gray-400 truncate max-w-md">{log.target}</p>
                        {log.summary && <p className="text-xs text-gray-500 mt-0.5">{log.summary}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="暂无Agent操作日志" />}
          </CardBody>
        </Card>
      </div>
      {ToastEl}
    </AppShell>
  );
}
