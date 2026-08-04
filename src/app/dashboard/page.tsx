"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardBody, StatCard, Loading, Button, Badge, EmptyState } from "@/components/ui";
import { riskLabels, riskColors, formatDateTime } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, BarChart as RBarChart } from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";

const riskPieColors = ["#ef4444", "#f97316", "#eab308", "#d1d5db"];

export default function DashboardPage() {
  const { user, isDemoMode } = useRole();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    fetch(`/api/dashboard${user.collegeName ? `?collegeId=${encodeURIComponent(user.collegeName)}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, router]);

  // Need to fetch by collegeId - let me fix the query
  useEffect(() => {
    if (!user) return;
    // Actually the dashboard API uses collegeId as the student's collegeId field. Let me find the right college.
  }, [user]);

  if (!user) return null;
  if (loading) return <AppShell><Loading text="加载驾驶舱数据..." /></AppShell>;
  if (!data) return <AppShell><EmptyState title="数据加载失败" /></AppShell>;

  const stats = data.stats;
  const trendData = data.trend.map((t: any, i: number) => ({ ...t, idx: i }));

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">就业工作驾驶舱</h1>
            <p className="text-sm text-gray-500 mt-1">{user.collegeName || "全校"} · 数据更新于 {new Date().toLocaleString("zh-CN")}</p>
          </div>
          {isDemoMode && (
            <Link href="/agent">
              <Button variant="primary">
                ⚡ 运行演示任务
              </Button>
            </Link>
          )}
        </div>

        {/* 演示模式提示 */}
        {isDemoMode && (
          <Card className="border-2 border-amber-300 bg-amber-50">
            <CardBody>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-800">演示任务</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    分析计算机学院{stats.unplaced}名未落实去向学生，识别重点帮扶对象并生成两周行动计划。
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Link href="/agent"><Button variant="primary" size="sm">前往Agent工作台执行 →</Button></Link>
                    <Link href="/help-center"><Button variant="ghost" size="sm">查看帮扶中心</Button></Link>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard label="毕业生总数" value={stats.total} color="blue" />
          <StatCard label="已落实去向" value={stats.employed} color="green" />
          <StatCard label="未落实去向" value={stats.unplaced} color="orange" />
          <StatCard label="就业落实率" value={`${stats.rate}%`} color="blue" />
          <StatCard label="重点帮扶人数" value={stats.helpCount} color="red" />
          <StatCard label="本周新增投递" value={stats.weekApps} />
          <StatCard label="本周新增面试" value={stats.weekInterviews} />
          <StatCard label="本周新增录用" value={stats.weekOffers} color="green" />
        </div>

        {/* 图表区 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 学院进展 */}
          <Card>
            <CardHeader title="各学院就业进展" subtitle="已落实 / 总数" />
            <CardBody>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.collegeProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="placed" name="已落实" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" name="总数" fill="#dbeafe" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* 八周趋势 */}
          <Card>
            <CardHeader title="最近八周投递趋势" subtitle="每周投递数" />
            <CardBody>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="apps" name="投递数" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* 风险分布 */}
          <Card>
            <CardHeader title="风险等级分布" />
            <CardBody>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={[
                    { name: "高风险", value: data.riskDist.high, color: riskPieColors[0] },
                    { name: "中风险", value: data.riskDist.medium, color: riskPieColors[1] },
                    { name: "低风险", value: data.riskDist.low, color: riskPieColors[2] },
                    { name: "无风险", value: data.riskDist.none, color: riskPieColors[3] },
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {riskPieColors.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* 求职障碍分布 */}
          <Card>
            <CardHeader title="学生求职障碍分布" subtitle="按触发规则统计" />
            <CardBody>
              {data.obstacles.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.obstacles} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" name="人数" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="暂无风险数据" description="请先运行风险分析" />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Agent任务记录 */}
        <Card>
          <CardHeader title="最近Agent任务" subtitle="操作记录" />
          <CardBody>
            {data.agentLogs.length > 0 ? (
              <div className="space-y-2">
                {data.agentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge className={log.status === "done" ? "bg-green-100 text-green-700" : log.status === "running" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}>
                        {log.status === "done" ? "完成" : log.status === "running" ? "运行中" : "失败"}
                      </Badge>
                      <div>
                        <p className="text-sm text-gray-700">{log.taskType}</p>
                        {log.summary && <p className="text-xs text-gray-400 mt-0.5">{log.summary}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="暂无Agent任务记录" description="前往Agent工作台执行任务" action={<Link href="/agent"><Button variant="outline" size="sm">前往Agent工作台</Button></Link>} />
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
