"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardBody, Button, Badge, Loading, EmptyState, Select, Modal, useToast, Input } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function MatchingPage() {
  const { user } = useRole();
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageModal, setMessageModal] = useState<{ recId: string; message: string } | null>(null);
  const { show, ToastEl } = useToast();

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    const params = new URLSearchParams({ pageSize: "100" });
    if (user.collegeName) params.set("collegeId", user.collegeName);
    fetch(`/api/students?${params}`).then(r => r.json()).then(d => setStudents(d.students));
  }, [user, router]);

  const match = async () => {
    if (!studentId) return;
    setLoading(true);
    const res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, action: "match" }) });
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  };

  const updateRec = async (recId: string, status: string) => {
    await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update-rec", recId, status }) });
    show("success", "已更新推荐状态");
  };

  const generateMessage = async (recId: string) => {
    const res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate-message", recId }) });
    const data = await res.json();
    setMessageModal({ recId, message: data.message });
  };

  const approveMessage = async (recId: string) => {
    await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update-rec", recId, messageStatus: "approved" }) });
    setMessageModal(null);
    show("success", "消息已审批通过（模拟发送）");
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">人岗匹配</h1>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Select value={studentId} onChange={setStudentId} placeholder="选择学生" options={students.map((s) => ({ value: s.id, label: `${s.name} - ${s.major?.name}` }))} className="w-72" />
              <Button variant="primary" onClick={match} disabled={!studentId || loading}>{loading ? "匹配中..." : "运行匹配"}</Button>
            </div>
          </CardBody>
        </Card>

        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">匹配结果（Top {results.length}）</h2>
            {results.map((r) => {
              const job = students.find((s) => s.id === studentId);
              return (
                <Card key={r.jobId}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-800">{r.jobId}</h3>
                          <Badge className={r.hardPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{r.hardPass ? "硬性通过" : "硬性不符"}</Badge>
                          {r.suggestApply && <Badge className="bg-brand-50 text-brand-600">建议投递</Badge>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">综合匹配度：{r.matchScore}%</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" onClick={() => updateRec(r.jobId, "confirmed")}>确认推荐</Button>
                        <Button variant="danger" size="sm" onClick={() => updateRec(r.jobId, "excluded")}>排除</Button>
                        <Button variant="outline" size="sm" onClick={() => updateRec(r.jobId, "queued")}>加入待投递</Button>
                        <Button variant="primary" size="sm" onClick={() => generateMessage(r.jobId)}>生成推荐消息</Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* 硬性条件 */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">硬性条件检查</h4>
                        <div className="space-y-1">
                          {r.hardChecks.map((h: any, i: number) => (
                            <div key={i} className="flex items-center gap-1 text-xs">
                              <span>{h.passed ? "✅" : "❌"}</span>
                              <span className="text-gray-600">{h.label}：</span>
                              <span className="text-gray-400">{h.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 匹配项 */}
                      <div>
                        <h4 className="text-xs font-semibold text-green-600 mb-1">满足的条件</h4>
                        {r.matchedItems.length > 0 ? (
                          <div className="space-y-1">
                            {r.matchedItems.map((m: any, i: number) => (<div key={i} className="text-xs text-gray-600">✓ {m.label}：{m.detail}</div>))}
                          </div>
                        ) : <span className="text-xs text-gray-400">无</span>}
                      </div>

                      {/* 不匹配项 */}
                      <div>
                        <h4 className="text-xs font-semibold text-red-500 mb-1">不满足 / 能力缺口</h4>
                        {r.unmatchedItems.length > 0 ? (
                          <div className="space-y-1">
                            {r.unmatchedItems.map((m: any, i: number) => (<div key={i} className="text-xs text-gray-600">✗ {m.label}：{m.detail}</div>))}
                          </div>
                        ) : <span className="text-xs text-gray-400">无</span>}
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <b>推荐原因：</b>{r.reason}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && results.length === 0 && studentId && (
          <EmptyState title="点击「运行匹配」查看结果" />
        )}
      </div>

      {messageModal && (
        <Modal open onClose={() => setMessageModal(null)} title="岗位推荐消息（需审批后发送）" size="lg" footer={<><Button variant="ghost" onClick={() => setMessageModal(null)}>取消</Button><Button variant="primary" onClick={() => approveMessage(messageModal.recId)}>审批通过并模拟发送</Button></>}>
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 rounded text-xs text-orange-700">⚠️ 此消息需辅导员审批后方可发送给学生。MVP模式下为模拟发送。</div>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap p-3 bg-gray-50 rounded">{messageModal.message}</pre>
          </div>
        </Modal>
      )}
      {ToastEl}
    </AppShell>
  );
}
