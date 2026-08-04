"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardBody, Button, Badge, Loading, EmptyState, Select, Modal, Input, useToast, Table, Th, Td } from "@/components/ui";
import { riskLabels, riskColors, formatDate, daysSince, taskTypeLabels, priorityLabels } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function HelpCenterPage() {
  const { user } = useRole();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectModal, setRejectModal] = useState<{ studentId: string } | null>(null);
  const [batchModal, setBatchModal] = useState(false);
  const { show, ToastEl } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (user?.collegeName) params.set("collegeId", user.collegeName);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/help?${params}`);
    const data = await res.json();
    setStudents(data.students);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchStudents(); }, [user, statusFilter]);

  const confirm = async (studentId: string, priority: number = 0) => {
    await fetch("/api/help", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "confirm", studentId, priority, userId: user?.id }) });
    show("success", "已确认加入重点帮扶名单");
    fetchStudents();
  };

  const reject = async (studentId: string, reason: string) => {
    await fetch("/api/help", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject", studentId, reason, userId: user?.id }) });
    show("info", "已驳回Agent建议");
    setRejectModal(null);
    fetchStudents();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">重点帮扶中心</h1>
            <p className="text-sm text-gray-500 mt-1">Agent识别的需重点帮扶学生，需辅导员确认</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onChange={setStatusFilter} placeholder="全部状态" options={[{ value: "pending", label: "待处理" }, { value: "confirmed", label: "跟进中" }, { value: "rejected", label: "已驳回" }]} />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-md">
            <span className="text-sm text-brand-700">已选择 {selected.size} 名学生</span>
            <Button variant="primary" size="sm" onClick={() => setBatchModal(true)}>批量创建任务</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>取消</Button>
          </div>
        )}

        <Card>
          {loading ? <Loading /> : students.length === 0 ? <EmptyState title="暂无重点帮扶学生" description="运行Agent任务后将在此显示" /> : (
            <Table>
              <thead>
                <tr>
                  <Th><input type="checkbox" onChange={() => { if (selected.size === students.length) setSelected(new Set()); else setSelected(new Set(students.map((s) => s.id))); }} checked={selected.size === students.length && students.length > 0} /></Th>
                  <Th>姓名</Th>
                  <Th>风险等级</Th>
                  <Th>主要问题</Th>
                  <Th>判断依据</Th>
                  <Th>推荐措施</Th>
                  <Th>最近活动</Th>
                  <Th>辅导员</Th>
                  <Th>状态</Th>
                  <Th>操作</Th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <Td><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} /></Td>
                    <Td><span className="font-medium text-brand-600 cursor-pointer" onClick={() => router.push(`/students/${s.id}`)}>{s.name}</span></Td>
                    <Td><Badge className={riskColors[s.riskLevel]}>{riskLabels[s.riskLevel]}</Badge></Td>
                    <Td className="text-xs text-gray-600 max-w-xs">
                      {s.riskReasons?.slice(0, 2).map((r: any, i: number) => (<div key={i}>• {r.ruleLabel}</div>))}
                    </Td>
                    <Td className="text-xs text-gray-400 max-w-xs">
                      {s.riskReasons?.slice(0, 2).map((r: any, i: number) => (<div key={i} className="truncate">{r.data}</div>))}
                    </Td>
                    <Td className="text-xs text-gray-600 max-w-xs">
                      {s.riskReasons?.slice(0, 2).map((r: any, i: number) => (<div key={i} className="truncate">{r.suggestion}</div>))}
                    </Td>
                    <Td className="text-xs text-gray-400">{s.lastActivity ? `${daysSince(s.lastActivity)}天前` : "—"}</Td>
                    <Td className="text-xs text-gray-500">{s.counselor?.name || "—"}</Td>
                    <Td><Badge className={s.helpListStatus === "pending" ? "bg-orange-100 text-orange-700" : s.helpListStatus === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                      {s.helpListStatus === "pending" ? "待处理" : s.helpListStatus === "confirmed" ? "跟进中" : s.helpListStatus === "rejected" ? "已驳回" : "—"}
                    </Badge></Td>
                    <Td>
                      {s.helpListStatus === "pending" && (
                        <div className="flex gap-1">
                          <Button variant="success" size="sm" onClick={() => confirm(s.id)}>确认</Button>
                          <Button variant="danger" size="sm" onClick={() => setRejectModal({ studentId: s.id })}>驳回</Button>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      {rejectModal && <RejectModal onClose={() => setRejectModal(null)} onSubmit={(reason) => reject(rejectModal.studentId, reason)} />}
      {batchModal && <BatchTaskModal onClose={() => setBatchModal(false)} studentIds={Array.from(selected)} ownerId={user.id} onSuccess={() => { setBatchModal(false); setSelected(new Set()); show("success", "任务已批量创建"); }} />}
      {ToastEl}
    </AppShell>
  );
}

function RejectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal open onClose={onClose} title="驳回Agent建议" footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button variant="danger" onClick={() => onSubmit(reason)} disabled={!reason}>确认驳回</Button></>}>
      <div><label className="text-sm text-gray-500">驳回原因</label><Input value={reason} onChange={setReason} placeholder="请填写驳回原因..." className="w-full mt-1" /></div>
    </Modal>
  );
}

function BatchTaskModal({ onClose, studentIds, ownerId, onSuccess }: { onClose: () => void; studentIds: string[]; ownerId: string; onSuccess: () => void }) {
  const [type, setType] = useState("interview");
  const [action, setAction] = useState("");
  const [priority, setPriority] = useState("high");
  const [deadline, setDeadline] = useState("");
  const submit = async () => {
    await fetch("/api/help", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "batch-create-tasks", studentIds, ownerId, type, taskAction: action, priority, deadline }) });
    onSuccess();
  };
  return (
    <Modal open onClose={onClose} title={`批量创建任务（${studentIds.length}名学生）`} footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button variant="primary" onClick={submit} disabled={!action}>创建</Button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm text-gray-500">任务类型</label><Select value={type} onChange={setType} className="w-full mt-1" options={Object.entries(taskTypeLabels).map(([v, l]) => ({ value: v, label: l }))} /></div>
          <div><label className="text-sm text-gray-500">优先级</label><Select value={priority} onChange={setPriority} className="w-full mt-1" options={Object.entries(priorityLabels).map(([v, l]) => ({ value: v, label: l }))} /></div>
        </div>
        <div><label className="text-sm text-gray-500">具体行动</label><Input value={action} onChange={setAction} placeholder="如：安排一对一面谈" className="w-full mt-1" /></div>
        <div><label className="text-sm text-gray-500">截止日期</label><Input type="date" value={deadline} onChange={setDeadline} className="w-full mt-1" /></div>
      </div>
    </Modal>
  );
}
