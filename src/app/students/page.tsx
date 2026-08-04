"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardBody, Button, Input, Select, Table, Th, Td, Loading, EmptyState, Badge, useToast, Modal } from "@/components/ui";
import { statusLabels, riskLabels, riskColors, activityLabels, formatDate, daysSince } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const { user } = useRole();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const { show, ToastEl } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (riskFilter) params.set("riskLevel", riskFilter);
    if (activityFilter) params.set("activityLevel", activityFilter);
    if (user?.collegeName) params.set("collegeId", user.collegeName);
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents(data.students);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    fetchStudents();
  }, [user, router, page, statusFilter, riskFilter, activityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { if (search) fetchStudents(); }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  };

  const batchRisk = async () => {
    if (selected.size === 0) return;
    setAnalyzing(true);
    const res = await fetch("/api/students", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "batch-risk", studentIds: Array.from(selected) }),
    });
    const data = await res.json();
    setAnalyzing(false);
    show("success", `已完成${data.count}名学生的风险分析`);
    fetchStudents();
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">学生管理</h1>
            <p className="text-sm text-gray-500 mt-1">共 {total} 名学生</p>
          </div>
        </div>

        {/* 筛选器 */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center gap-3">
              <Input value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="搜索姓名或学号..." className="w-48" />
              <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} placeholder="就业状态" options={Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))} />
              <Select value={riskFilter} onChange={(v) => { setRiskFilter(v); setPage(1); }} placeholder="风险等级" options={Object.entries(riskLabels).map(([v, l]) => ({ value: v, label: l }))} />
              <Select value={activityFilter} onChange={(v) => { setActivityFilter(v); setPage(1); }} placeholder="求职活跃度" options={Object.entries(activityLabels).map(([v, l]) => ({ value: v, label: l }))} />
              {(statusFilter || riskFilter || activityFilter || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter(""); setRiskFilter(""); setActivityFilter(""); setPage(1); }}>清除筛选</Button>
              )}
            </div>

            {selected.size > 0 && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-brand-50 rounded-md">
                <span className="text-sm text-brand-700">已选择 {selected.size} 名学生</span>
                <Button variant="primary" size="sm" onClick={batchRisk} disabled={analyzing}>
                  {analyzing ? "分析中..." : "批量运行风险分析"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>取消选择</Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 表格 */}
        <Card>
          {loading ? <Loading /> : students.length === 0 ? <EmptyState title="未找到学生" description="尝试调整筛选条件" /> : (
            <Table>
              <thead>
                <tr>
                  <Th><input type="checkbox" checked={selected.size === students.length && students.length > 0} onChange={toggleSelectAll} className="rounded" /></Th>
                  <Th>姓名</Th>
                  <Th>学号</Th>
                  <Th>专业</Th>
                  <Th>就业状态</Th>
                  <Th>风险等级</Th>
                  <Th>活跃度</Th>
                  <Th>投递/面试</Th>
                  <Th>最近投递</Th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/students/${s.id}`)}>
                    <Td onClick={(e: any) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="rounded" />
                    </Td>
                    <Td className="font-medium text-brand-600">{s.name}</Td>
                    <Td className="text-gray-500 text-xs">{s.studentNo}</Td>
                    <Td className="text-gray-600">{s.major?.name}</Td>
                    <Td><Badge className="bg-gray-100 text-gray-600">{statusLabels[s.employmentStatus] || s.employmentStatus}</Badge></Td>
                    <Td><Badge className={riskColors[s.riskLevel]}>{riskLabels[s.riskLevel]}</Badge></Td>
                    <Td><span className="text-xs text-gray-500">{activityLabels[s.activityLevel] || "—"}</span></Td>
                    <Td className="text-xs text-gray-500">{s.appCount}投 / {s.interviewCount}面</Td>
                    <Td className="text-xs text-gray-400">{s.lastApplication ? `${daysSince(s.lastApplication)}天前` : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        )}
      </div>
      {ToastEl}
    </AppShell>
  );
}
