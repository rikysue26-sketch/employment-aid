"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { AppShell } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardBody, Button, Badge, Loading, EmptyState, Modal, Input, Select, useToast, Drawer } from "@/components/ui";
import { statusLabels, riskLabels, riskColors, formatDate, formatDateTime, daysSince, taskTypeLabels, taskStatusLabels, priorityLabels, priorityColors } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";

export default function StudentDetailPage() {
  const { user } = useRole();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [resumeAdvice, setResumeAdvice] = useState<any>(null);
  const [commOutline, setCommOutline] = useState<string[] | null>(null);
  const [matching, setMatching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { show, ToastEl } = useToast();

  const fetchStudent = async () => {
    const res = await fetch(`/api/student-detail?id=${studentId}`);
    const data = await res.json();
    setStudent(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    fetchStudent();
  }, [user, router, studentId]);

  const runRisk = async () => {
    setAnalyzing(true);
    const res = await fetch("/api/risk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId }) });
    await res.json();
    setAnalyzing(false);
    show("success", "风险分析完成");
    fetchStudent();
  };

  const matchJobs = async () => {
    setMatching(true);
    const res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, action: "match" }) });
    await res.json();
    setMatching(false);
    show("success", "岗位匹配完成");
    fetchStudent();
  };

  const getResumeAdvice = async () => {
    const res = await fetch("/api/student-detail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resume-advice", studentId }) });
    const data = await res.json();
    setResumeAdvice(data);
  };

  const getCommOutline = async () => {
    const res = await fetch("/api/student-detail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "comm-outline", studentId }) });
    const data = await res.json();
    setCommOutline(data.outline);
  };

  if (!user) return null;
  if (loading) return <AppShell><Loading text="加载学生详情..." /></AppShell>;
  if (!student) return <AppShell><EmptyState title="学生不存在" /></AppShell>;

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* 返回 + 标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>← 返回</Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {student.name}
                {student.isFictional && <Badge className="bg-gray-100 text-gray-400 text-xs">虚构数据</Badge>}
              </h1>
              <p className="text-sm text-gray-500">{student.studentNo} · {student.major?.name} · {student.college?.name}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={runRisk} disabled={analyzing}>{analyzing ? "分析中..." : "重新风险分析"}</Button>
            <Button variant="outline" size="sm" onClick={matchJobs} disabled={matching}>{matching ? "匹配中..." : "匹配岗位"}</Button>
            <Button variant="outline" size="sm" onClick={getResumeAdvice}>简历优化建议</Button>
            <Button variant="outline" size="sm" onClick={getCommOutline}>生成沟通提纲</Button>
            <Button variant="outline" size="sm" onClick={() => setShowTaskModal(true)}>创建帮扶任务</Button>
            <Button variant="outline" size="sm" onClick={() => setShowCommModal(true)}>添加沟通记录</Button>
            <Button variant="primary" size="sm" onClick={() => setShowStatusModal(true)}>更新就业状态</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：基本信息 */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="基本信息" />
              <CardBody className="space-y-2 text-sm">
                <Row label="学号" value={student.studentNo} />
                <Row label="性别" value={student.gender} />
                <Row label="学院" value={student.college?.name} />
                <Row label="专业" value={student.major?.name} />
                <Row label="学历" value={student.degreeLevel === "bachelor" ? "本科" : student.degreeLevel === "master" ? "硕士" : "博士"} />
                <Row label="届别" value={student.grade} />
                <Row label="辅导员" value={student.counselor?.name || "—"} />
                <Row label="经济情况" value={student.financialStatus === "normal" ? "一般" : student.financialStatus === "difficulty" ? "困难" : student.financialStatus === "poverty" ? "特困" : "—"} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="求职意向" />
              <CardBody className="space-y-2 text-sm">
                <Row label="目标岗位" value={student.intendedRole || "未设定"} />
                <Row label="目标城市" value={student.intendedCity || "未设定"} />
                <Row label="期望薪资" value={student.intendedSalary || "未设定"} />
                <Row label="行业偏好" value={student.industryPref || "未设定"} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="技能标签" />
              <CardBody>
                <div className="flex flex-wrap gap-1.5">
                  {(student.skills || []).map((skill: string, i: number) => (
                    <Badge key={i} className="bg-brand-50 text-brand-600">{skill}</Badge>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="简历内容" subtitle={`评分：${student.resumeScore || "—"}/100`} />
              <CardBody>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{student.resumeText || "暂无简历内容"}</p>
              </CardBody>
            </Card>
          </div>

          {/* 中间：风险分析和推荐 */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Agent分析结论" subtitle={`分析时间：${formatDateTime(student.riskAnalyzedAt)}`} />
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-gray-500">风险等级：</span>
                  <Badge className={riskColors[student.riskLevel]}>{riskLabels[student.riskLevel]}</Badge>
                </div>
                {student.riskReasons && student.riskReasons.length > 0 ? (
                  <div className="space-y-3">
                    {student.riskReasons.map((r: any, i: number) => (
                      <div key={i} className="border-l-2 pl-3 py-1" style={{ borderColor: r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f97316" : "#eab308" }}>
                        <p className="text-sm font-medium text-gray-700">{r.ruleLabel}</p>
                        <p className="text-xs text-gray-500 mt-0.5">数据依据：{r.data}</p>
                        <p className="text-xs text-gray-500">建议：{r.suggestion}</p>
                        {r.needsApproval && <Badge className="bg-orange-50 text-orange-600 mt-1">需人工审批</Badge>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="暂无风险分析结果" description="点击「重新风险分析」按钮" />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="推荐岗位" subtitle={`${student.recommendations?.length || 0}条推荐`} />
              <CardBody>
                {student.recommendations && student.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {student.recommendations.slice(0, 5).map((rec: any) => (
                      <div key={rec.id} className="p-3 border border-gray-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{rec.job.title}</p>
                            <p className="text-xs text-gray-400">{rec.job.enterprise?.name} · {rec.job.city}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={rec.hardPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{rec.hardPass ? "硬性通过" : "硬性不符"}</Badge>
                            <p className="text-xs text-gray-400 mt-0.5">匹配度 {rec.matchScore}%</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="暂无推荐岗位" description="点击「匹配岗位」按钮" />
                )}
              </CardBody>
            </Card>
          </div>

          {/* 右侧：投递、面试、沟通 */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="投递记录" subtitle={`${student.applications?.length || 0}条`} />
              <CardBody>
                {student.applications && student.applications.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {student.applications.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-gray-700">{a.job.title}</p>
                          <p className="text-xs text-gray-400">{a.job.enterprise?.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-gray-100 text-gray-600 text-xs">{a.status}</Badge>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.appliedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState title="暂无投递记录" />}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="面试记录" subtitle={`${student.interviews?.length || 0}条`} />
              <CardBody>
                {student.interviews && student.interviews.length > 0 ? (
                  <div className="space-y-2">
                    {student.interviews.map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-gray-700">{i.job?.title || "—"}</p>
                          <p className="text-xs text-gray-400">第{i.round}轮 · {formatDate(i.date)}</p>
                        </div>
                        <Badge className={i.result === "passed" ? "bg-green-100 text-green-700" : i.result === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}>
                          {i.result === "passed" ? "通过" : i.result === "failed" ? "未通过" : "待定"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState title="暂无面试记录" />}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="辅导员沟通记录" subtitle={`${student.communications?.length || 0}条`} />
              <CardBody>
                {student.communications && student.communications.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {student.communications.map((c: any) => (
                      <div key={c.id} className="text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <div className="flex justify-between">
                          <span className="text-gray-700">{c.counselor?.name}</span>
                          <span className="text-xs text-gray-400">{formatDate(c.date)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{c.content}</p>
                        {c.result && <p className="text-xs text-gray-400">结果：{c.result}</p>}
                      </div>
                    ))}
                  </div>
                ) : <EmptyState title="暂无沟通记录" />}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="帮扶任务时间线" subtitle={`${student.tasks?.length || 0}条`} />
              <CardBody>
                {student.tasks && student.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {student.tasks.map((t: any) => (
                      <div key={t.id} className="text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">{taskTypeLabels[t.type]}</span>
                          <Badge className={priorityColors[t.priority]}>{priorityLabels[t.priority]}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{t.action}</p>
                        <p className="text-xs text-gray-400">截止：{formatDate(t.deadline)}</p>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState title="暂无帮扶任务" />}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* 当前就业状态 */}
        <Card>
          <CardHeader title="当前就业状态" />
          <CardBody>
            <div className="flex items-center gap-4">
              <Badge className="bg-brand-50 text-brand-700 text-sm px-3 py-1">{statusLabels[student.employmentStatus]}</Badge>
              <span className="text-sm text-gray-500">更新于 {formatDate(student.statusUpdatedAt)}</span>
              <Button variant="outline" size="sm" onClick={() => setShowStatusModal(true)}>更新状态</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modals */}
      <StatusModal open={showStatusModal} onClose={() => setShowStatusModal(false)} studentId={studentId} onSuccess={() => { setShowStatusModal(false); fetchStudent(); show("success", "状态已更新"); }} />
      <CommModal open={showCommModal} onClose={() => setShowCommModal(false)} studentId={studentId} counselorId={user.id} onSuccess={() => { setShowCommModal(false); fetchStudent(); show("success", "沟通记录已添加"); }} />
      <TaskModal open={showTaskModal} onClose={() => setShowTaskModal(false)} studentId={studentId} ownerId={user.id} onSuccess={() => { setShowTaskModal(false); fetchStudent(); show("success", "任务已创建"); }} />

      {/* Resume Advice Modal */}
      <Modal open={!!resumeAdvice} onClose={() => setResumeAdvice(null)} title="简历优化建议" size="lg" footer={<Button variant="primary" onClick={() => setResumeAdvice(null)}>关闭</Button>}>
        {resumeAdvice && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">简历评分：{resumeAdvice.score}/100</h4>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">发现问题</h4>
              <ul className="space-y-1">{resumeAdvice.issues.map((i: string, idx: number) => <li key={idx} className="text-sm text-gray-600">• {i}</li>)}</ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">改进建议</h4>
              <ul className="space-y-1">{resumeAdvice.suggestions.map((s: string, idx: number) => <li key={idx} className="text-sm text-gray-600">• {s}</li>)}</ul>
            </div>
            {resumeAdvice.conclusions && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Agent结论</h4>
                <div className="space-y-1">{resumeAdvice.conclusions.map((c: any, idx: number) => (
                  <div key={idx} className="flex gap-2 text-sm">
                    <Badge className="bg-gray-100 text-gray-500 text-xs flex-shrink-0">{c.category === "fact" ? "事实" : c.category === "computed" ? "计算" : c.category === "inference" ? "推测" : c.category === "missing" ? "缺失" : "待确认"}</Badge>
                    <span className="text-gray-600"><b>{c.label}：</b>{c.content}</span>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Comm Outline Modal */}
      <Modal open={!!commOutline} onClose={() => setCommOutline(null)} title="沟通提纲" size="lg" footer={<Button variant="primary" onClick={() => setCommOutline(null)}>关闭</Button>}>
        {commOutline && (
          <div className="space-y-2">
            {commOutline.map((line, i) => <p key={i} className="text-sm text-gray-600">{line}</p>)}
          </div>
        )}
      </Modal>
      {ToastEl}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

function StatusModal({ open, onClose, studentId, onSuccess }: { open: boolean; onClose: () => void; studentId: string; onSuccess: () => void }) {
  const [status, setStatus] = useState("");
  const options = [
    { value: "unplaced", label: "未落实去向" }, { value: "employed", label: "已就业" },
    { value: "postgrad", label: "升学" }, { value: "military", label: "入伍" },
    { value: "entrepreneurship", label: "自主创业" }, { value: "abroad", label: "出国" },
  ];
  const submit = async () => {
    await fetch("/api/student-detail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update-status", studentId, status }) });
    onSuccess();
  };
  return (
    <Modal open={open} onClose={onClose} title="更新就业状态" footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button variant="primary" onClick={submit} disabled={!status}>确认</Button></>}>
      <Select value={status} onChange={setStatus} options={options} placeholder="选择就业状态" className="w-full" />
    </Modal>
  );
}

function CommModal({ open, onClose, studentId, counselorId, onSuccess }: { open: boolean; onClose: () => void; studentId: string; counselorId: string; onSuccess: () => void }) {
  const [type, setType] = useState("phone");
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");
  const submit = async () => {
    await fetch("/api/student-detail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add-comm", studentId, counselorId, type, content, result }) });
    setContent(""); setResult("");
    onSuccess();
  };
  return (
    <Modal open={open} onClose={onClose} title="添加沟通记录" footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button variant="primary" onClick={submit} disabled={!content}>保存</Button></>}>
      <div className="space-y-3">
        <div><label className="text-sm text-gray-500">沟通方式</label><Select value={type} onChange={setType} className="w-full mt-1" options={[{ value: "phone", label: "电话" }, { value: "wechat", label: "微信" }, { value: "inperson", label: "面谈" }, { value: "email", label: "邮件" }]} /></div>
        <div><label className="text-sm text-gray-500">沟通内容</label><Input value={content} onChange={setContent} placeholder="沟通内容..." className="w-full mt-1" /></div>
        <div><label className="text-sm text-gray-500">沟通结果</label><Input value={result} onChange={setResult} placeholder="沟通结果..." className="w-full mt-1" /></div>
      </div>
    </Modal>
  );
}

function TaskModal({ open, onClose, studentId, ownerId, onSuccess }: { open: boolean; onClose: () => void; studentId: string; ownerId: string; onSuccess: () => void }) {
  const [type, setType] = useState("interview");
  const [priority, setPriority] = useState("medium");
  const [action, setAction] = useState("");
  const [acceptance, setAcceptance] = useState("");
  const [deadline, setDeadline] = useState("");
  const submit = async () => {
    await fetch("/api/student-detail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create-task", studentId, ownerId, type, priority, taskAction: action, acceptance, deadline }) });
    setAction(""); setAcceptance(""); setDeadline("");
    onSuccess();
  };
  return (
    <Modal open={open} onClose={onClose} title="创建帮扶任务" footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button variant="primary" onClick={submit} disabled={!action}>创建</Button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm text-gray-500">任务类型</label><Select value={type} onChange={setType} className="w-full mt-1" options={Object.entries(taskTypeLabels).map(([v, l]) => ({ value: v, label: l }))} /></div>
          <div><label className="text-sm text-gray-500">优先级</label><Select value={priority} onChange={setPriority} className="w-full mt-1" options={Object.entries(priorityLabels).map(([v, l]) => ({ value: v, label: l }))} /></div>
        </div>
        <div><label className="text-sm text-gray-500">具体行动</label><Input value={action} onChange={setAction} placeholder="如：安排一对一面谈" className="w-full mt-1" /></div>
        <div><label className="text-sm text-gray-500">验收标准</label><Input value={acceptance} onChange={setAcceptance} placeholder="如：学生完成简历修改" className="w-full mt-1" /></div>
        <div><label className="text-sm text-gray-500">截止日期</label><Input type="date" value={deadline} onChange={setDeadline} className="w-full mt-1" /></div>
      </div>
    </Modal>
  );
}
