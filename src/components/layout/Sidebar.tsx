"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "就业驾驶舱", icon: "📊", roles: ["admin", "counselor", "leader"] },
  { href: "/students", label: "学生管理", icon: "👥", roles: ["admin", "counselor"] },
  { href: "/help-center", label: "重点帮扶中心", icon: "🎯", roles: ["admin", "counselor"] },
  { href: "/jobs", label: "岗位管理", icon: "💼", roles: ["admin", "counselor"] },
  { href: "/matching", label: "人岗匹配", icon: "🔗", roles: ["counselor"] },
  { href: "/tasks", label: "帮扶任务中心", icon: "📋", roles: ["admin", "counselor"] },
  { href: "/agent", label: "Agent工作台", icon: "🤖", roles: ["admin", "counselor"] },
  { href: "/reports", label: "报告中心", icon: "📄", roles: ["admin", "counselor", "leader"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useRole();
  if (!user) return null;
  const items = navItems.filter((item) => item.roles.includes(user.role));

  const roleLabel = { admin: "就业中心管理员", counselor: "学院辅导员", leader: "学院领导" }[user.role];

  return (
    <aside className="w-56 bg-brand-900 text-white flex flex-col min-h-screen flex-shrink-0">
      <div className="px-4 py-4 border-b border-brand-800">
        <h1 className="text-sm font-bold leading-tight">高校毕业生就业</h1>
        <h2 className="text-sm font-bold leading-tight">精准帮扶 Agent 平台</h2>
      </div>
      <div className="px-4 py-3 border-b border-brand-800">
        <p className="text-xs text-brand-300">当前身份</p>
        <p className="text-sm font-medium mt-0.5">{user.name}</p>
        <p className="text-xs text-brand-300 mt-0.5">{roleLabel}{user.collegeName ? ` · ${user.collegeName}` : ""}</p>
      </div>
      <nav className="flex-1 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                active ? "bg-brand-700 text-white font-medium" : "text-brand-100 hover:bg-brand-800"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-brand-800">
        <Link href="/" className="flex items-center gap-2 text-xs text-brand-300 hover:text-white">
          <span>←</span> 切换角色
        </Link>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useRole();
  if (!user) return <>{children}</>;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-auto bg-gray-50">{children}</main>
    </div>
  );
}
