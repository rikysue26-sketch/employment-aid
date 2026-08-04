import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/lib/role-context";

export const metadata: Metadata = {
  title: "高校毕业生就业精准帮扶 Agent 平台",
  description: "面向高校招生就业处的就业帮扶智能管理平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
