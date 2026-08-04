"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardBody, Button, Badge, Loading, EmptyState, Table, Th, Td, Modal, Input, Select, useToast } from "@/components/ui";
import { taskTypeLabels, taskStatusLabels, priorityLabels, priorityColors, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const { user } = useRole();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "board">("list");
  const [statusFilter, setStatusFilter] = useState("");
  const [followupModal, setFollowupModal] = useState<string | null>(null);
  const { show, ToastEl } = useToast();

  const fetchTasks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (user?.id) params.set("ownerId", user.id);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    setTasks(data.tasks);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchTasks(); }, [user, statusFilter]);

  const updateStatus = async (taskId: string, status: string) => {
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update-status", taskId, status }) });
    show("success", "状态已更新");
    fetchTasks();
  };

  const addFollowup = async (taskId: string, content: string) => {
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add-followup", taskId, content }) });
    setFollowupModal(null);
    show("success", "跟进记录已添加");
    fetchTasks();
  };

  if (!user) return null;

  const columns = [
    { status: "pending", label: "待处理", color: "bg-gray-100" },
    { status: "in_progress", label: "进行中", color: "bg-blue-50" },
    { status: "done", label: "已完成", color: "bg-green-50" },
  ];

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">帮扶任务中心</h1>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onChange={setStatusFilter} placeholder="全部状态" options={[{ value: "pending", label: "待处理" }, { value: "in_progress", label: "进行中" }, { value: "done", label: "已完成" }]} />
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button onClick={() => setView("list")} className={`px-3 py-2 text-sm ${view === "list" ? "bg-brand-600 text-white" : "bg-white text-gray-600"}`}>列表</button>
              <button onClick={() => setView("board")} className={`px-3 py-2 text-sm ${view === "board" ? "bg-brand-600 text-white" : "bg-white text-gray-600"}`}>看板</button>
            </div>
          </div>
        </div>

        {loading ? <Loading /> : tasks.length === 0 ? <EmptyState title="暂无帮扶任务" /> : view === "list" ? (
          <Card>
            <Table>
              <thead>
                <tr><Th>学生</Th><Th>任务类型</Th><Th>优先级</Th><Th>具体行动</Th><Th>验收标准</Th><Th>截止日期</Th><Th>状态</Th><Th>操作</Th></tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <Td><span className="font-medium text-brand-600 cursor-pointer" onClick={() => router.push(`/students/${t.studentId}`)}>{t.student?.name}</span></Td>
                    <Td className="text-sm">{taskTypeLabels[t.type]}</Td>
                    <Td><Badge className={priorityColors[t.priority]}>{priorityLabels[t.priority]}</Badge></Td>
                    <Td className="text-sm text-gray-600">{t.action}</Td>
                    <Td className="text-xs text-gray-400">{t.acceptance || "—"}</Td>
                    <Td className="text-xs text-gray-400">{formatDate(t.deadline)}</Td>
                    <Td><Badge className="bg-gray-100 text-gray-600">{taskStatusLabels[t.status]}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        {t.status !== "done" && <>
                          {t.status === "pending" && <Button variant="outline" size="sm" onClick={() => updateStatus(t.id, "in_progress")}>开始</Button>}
                          <Button variant="ghost" size="sm" onClick={() => setFollowupModal(t.id)}>跟进</Button>
                          <Button variant="success" size="sm" onClick={() => updateStatus(t.id, "done")}>完成</Button>
                        </>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.status);
              return (
                <div key={col.status} className={`${col.color} rounded-lg p-3`}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{col.label}（{colTasks.length}）</h3>
                  <div className="space-y-2">
                    {colTasks.map((t) => (
                      <div key={t.id} className="bg-white rounded-md p-3 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{t.student?.name}</span>
                          <Badge className={priorityColors[t.priority]}>{priorityLabels[t.priority]}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">{taskTypeLabels[t.type]}</p>
                        <p className="text-sm text-gray-600 mt-1">{t.action}</p>
                        <p className="text-xs text-gray-400 mt-1">截止：{formatDate(t.deadline)}</p>
                        <div className="mt-2 flex gap-1">
                          {t.status === "pending" && <Button variant="outline" size="sm" onClick={() => updateStatus(t.id, "in_progress")}>开始</Button>}
                          {t.status !== "done" && <>
                            <Button variant="ghost" size="sm" onClick={() => setFollowupModal(t.id)}>跟进</Button>
                            <Button variant="success" size="sm" onClick={() => updateStatus(t.id, "done")}>完成</Button>
                          </>}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">暂无</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {followupModal && <FollowupModal onClose={() => setFollowupModal(null)} onSubmit={(content) => addFollowup(followupModal, content)} />}
      {ToastEl}
    </AppShell>
  );
}

function FollowupModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (content: string) => void }) {
  const [content, setContent] = useState("");
  return (
    <Modal open onClose={onClose} title="添加跟进记录" footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button variant="primary" onClick={() => onSubmit(content)} disabled={!content}>保存</Button></>}>
      <Input value={content} onChange={setContent} placeholder="跟进内容..." className="w-full" />
    </Modal>
  );
}
