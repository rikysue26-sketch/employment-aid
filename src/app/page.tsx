"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { Button, Card, CardBody } from "@/components/ui";

const roles = [
  { id: "admin", name: "管理员张老师", role: "admin" as const, desc: "就业中心管理员", college: null, collegeName: null, icon: "🏛️", features: ["全校就业数据", "学院排名和趋势", "导入学生及岗位数据", "生成校级报告"] },
  { id: "counselor-cs", name: "计算机辅导员李老师", role: "counselor" as const, desc: "计算机学院辅导员", college: "计算机学院", collegeName: "计算机学院", icon: "👨‍🏫", features: ["管理本学院学生", "重点帮扶名单", "岗位推荐", "创建帮扶任务"] },
  { id: "counselor-ee", name: "电信辅导员王老师", role: "counselor" as const, desc: "电子信息学院辅导员", college: "电子信息学院", collegeName: "电子信息学院", icon: "👩‍🏫", features: ["管理本学院学生", "重点帮扶名单", "岗位推荐", "创建帮扶任务"] },
  { id: "leader", name: "计算机学院赵院长", role: "leader" as const, desc: "计算机学院领导", college: "计算机学院", collegeName: "计算机学院", icon: "🏫", features: ["就业驾驶舱", "风险概况", "帮扶进度", "生成和导出周报"] },
];

export default function HomePage() {
  const router = useRouter();
  const { user, setUser, setDemoMode } = useRole();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selectRole = (r: typeof roles[0]) => {
    setUser({ id: r.id, name: r.name, role: r.role, collegeId: null, collegeName: r.collegeName });
    router.push("/dashboard");
  };

  const enterDemo = () => {
    setUser({ id: "counselor-cs", name: "计算机辅导员李老师", role: "counselor", collegeId: null, collegeName: "计算机学院" });
    setDemoMode(true);
    router.push("/dashboard");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">高校毕业生就业精准帮扶 Agent 平台</h1>
          <p className="text-brand-200 text-sm">选择演示身份进入系统 · 所有数据均为虚构模拟数据</p>
        </div>

        {/* 演示模式入口 */}
        <Card className="mb-6 border-2 border-amber-300">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-amber-500">⚡</span> 演示模式
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  一键进入「计算机学院辅导员」身份，首页提供演示任务：<br/>
                  「分析计算机学院未落实去向学生，识别重点帮扶对象并生成两周行动计划」
                </p>
              </div>
              <Button variant="primary" size="lg" onClick={enterDemo} className="bg-amber-500 hover:bg-amber-600 border-amber-500 whitespace-nowrap">
                进入演示模式 →
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <Card key={r.id} className="cursor-pointer hover:shadow-md hover:border-brand-300 transition-all" >
              <CardBody onClick={() => selectRole(r)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">{r.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800">{r.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{r.desc}{r.college ? ` · ${r.college}` : ""}</p>
                    <ul className="mt-2 space-y-0.5">
                      {r.features.map((f, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="text-brand-400">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <p className="text-center text-brand-300 text-xs mt-6">
          本系统所有学生数据均为虚构模拟数据，不代表任何真实个人信息
        </p>
      </div>
    </div>
  );
}
