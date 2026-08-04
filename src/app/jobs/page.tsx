"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardBody, Button, Input, Select, Table, Th, Td, Loading, EmptyState, Badge, Modal, useToast } from "@/components/ui";
import { formatDate, daysSince } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const { user } = useRole();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editJob, setEditJob] = useState<any>(null);
  const { show, ToastEl } = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/jobs?${params}`);
    const data = await res.json();
    setJobs(data.jobs);
    setTotalPages(data.totalPages);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchJobs(); }, [user, page, statusFilter]);
  useEffect(() => { const t = setTimeout(() => { if (search) fetchJobs(); }, 500); return () => clearTimeout(t); }, [search]);

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">岗位管理</h1>
          <Button variant="primary" size="sm" onClick={() => { setEditJob(null); setShowEditModal(true); }}>+ 新增岗位</Button>
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-wrap gap-3">
              <Input value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="搜索岗位或企业..." className="w-48" />
              <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} placeholder="岗位状态" options={[{ value: "open", label: "开放招聘" }, { value: "closed", label: "已关闭" }, { value: "filled", label: "已满" }]} />
            </div>
          </CardBody>
        </Card>

        <Card>
          {loading ? <Loading /> : jobs.length === 0 ? <EmptyState title="暂无岗位" /> : (
            <Table>
              <thead>
                <tr><Th>企业</Th><Th>岗位</Th><Th>城市</Th><Th>学历</Th><Th>专业要求</Th><Th>薪资</Th><Th>截止日期</Th><Th>招聘人数</Th><Th>状态</Th><Th>操作</Th></tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <Td className="text-xs text-gray-500">{j.enterprise?.name}</Td>
                    <Td className="font-medium text-gray-700">{j.title}</Td>
                    <Td className="text-gray-600">{j.city}</Td>
                    <Td><Badge className="bg-gray-100 text-gray-600">{j.degreeReq === "bachelor" ? "本科" : j.degreeReq === "master" ? "硕士" : "博士"}</Badge></Td>
                    <Td className="text-xs text-gray-500">{j.majorReq || "不限"}</Td>
                    <Td className="text-xs text-gray-600">{j.salaryRange || "面议"}</Td>
                    <Td className="text-xs text-gray-400">{j.deadline ? formatDate(j.deadline) : "—"}</Td>
                    <Td className="text-center">{j.headcount}</Td>
                    <Td><Badge className={j.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>{j.status === "open" ? "开放" : j.status === "closed" ? "关闭" : "已满"}</Badge></Td>
                    <Td><Button variant="ghost" size="sm" onClick={() => { setEditJob(j); setShowEditModal(true); }}>编辑</Button></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        )}
      </div>
      {showEditModal && <JobEditModal job={editJob} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); show("success", "岗位已保存"); fetchJobs(); }} />}
      {ToastEl}
    </AppShell>
  );
}

function JobEditModal({ job, onClose, onSuccess }: { job: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    id: job?.id || "", enterpriseId: job?.enterpriseId || "", title: job?.title || "", city: job?.city || "",
    degreeReq: job?.degreeReq || "bachelor", majorReq: job?.majorReq || "", skillReq: job?.skillReq ? JSON.parse(job.skillReq).join(", ") : "",
    salaryRange: job?.salaryRange || "", deadline: job?.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
    headcount: job?.headcount || 1, status: job?.status || "open", certReq: job?.certReq || "",
  });
  const [enterprises, setEnterprises] = useState<any[]>([]);

  useEffect(() => { fetch("/api/jobs").then(r => r.json()).then(() => {}); }, []);

  const submit = async () => {
    const body = { ...form, action: form.id ? "update" : "create", skillReq: form.skillReq.split(",").map((s: string) => s.trim()).filter(Boolean) };
    await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title={form.id ? "编辑岗位" : "新增岗位"} size="lg" footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button variant="primary" onClick={submit} disabled={!form.title || !form.enterpriseId}>保存</Button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm text-gray-500">企业ID</label><Input value={form.enterpriseId} onChange={(v) => setForm({ ...form, enterpriseId: v })} className="w-full mt-1" /></div>
          <div><label className="text-sm text-gray-500">岗位名称</label><Input value={form.title} onChange={(v) => setForm({ ...form, title: v })} className="w-full mt-1" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm text-gray-500">城市</label><Input value={form.city} onChange={(v) => setForm({ ...form, city: v })} className="w-full mt-1" /></div>
          <div><label className="text-sm text-gray-500">学历要求</label><Select value={form.degreeReq} onChange={(v) => setForm({ ...form, degreeReq: v })} className="w-full mt-1" options={[{ value: "bachelor", label: "本科" }, { value: "master", label: "硕士" }, { value: "doctor", label: "博士" }]} /></div>
        </div>
        <div><label className="text-sm text-gray-500">专业要求（逗号分隔）</label><Input value={form.majorReq} onChange={(v) => setForm({ ...form, majorReq: v })} className="w-full mt-1" /></div>
        <div><label className="text-sm text-gray-500">技能要求（逗号分隔）</label><Input value={form.skillReq} onChange={(v) => setForm({ ...form, skillReq: v })} className="w-full mt-1" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm text-gray-500">薪资范围</label><Input value={form.salaryRange} onChange={(v) => setForm({ ...form, salaryRange: v })} placeholder="如 10k-18k" className="w-full mt-1" /></div>
          <div><label className="text-sm text-gray-500">招聘人数</label><Input type="number" value={String(form.headcount)} onChange={(v) => setForm({ ...form, headcount: parseInt(v) || 1 })} className="w-full mt-1" /></div>
        </div>
        <div><label className="text-sm text-gray-500">截止日期</label><Input type="date" value={form.deadline} onChange={(v) => setForm({ ...form, deadline: v })} className="w-full mt-1" /></div>
      </div>
    </Modal>
  );
}
