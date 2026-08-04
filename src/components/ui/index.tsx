"use client";
import React from "react";
import { cn } from "@/lib/utils";

// Badge
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", className)}>{children}</span>;
}

// Card
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div className={cn("p-5", className)} onClick={onClick}>{children}</div>;
}

// Button
export function Button({
  children, onClick, variant = "default", size = "default", disabled, className, type = "button",
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "default" | "primary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "default" | "lg"; disabled?: boolean; className?: string; type?: "button" | "submit";
}) {
  const variants = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
    primary: "bg-brand-600 text-white hover:bg-brand-700 border border-brand-600",
    outline: "bg-white text-brand-600 hover:bg-brand-50 border border-brand-300",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    success: "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200",
  };
  const sizes = { sm: "px-2.5 py-1 text-xs", default: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant], sizes[size], className
      )}
    >
      {children}
    </button>
  );
}

// Input
export function Input({ value, onChange, placeholder, className, type = "text" }: {
  value?: string; onChange?: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn("px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent", className)}
    />
  );
}

// Select
export function Select({ value, onChange, options, placeholder, className }: {
  value?: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string; className?: string;
}) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn("px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400", className)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Modal / Dialog
export function Modal({ open, onClose, title, children, footer, size = "default" }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode; size?: "default" | "lg" | "xl";
}) {
  if (!open) return null;
  const sizes = { default: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={cn("bg-white rounded-lg shadow-xl w-full mx-4 max-h-[90vh] flex flex-col", sizes[size])} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">{footer}</div>}
      </div>
    </div>
  );
}

// Drawer
export function Drawer({ open, onClose, title, children, width = 480 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="bg-white h-full flex flex-col shadow-xl" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// StatCard
export function StatCard({ label, value, sublabel, color = "default", icon }: {
  label: string; value: string | number; sublabel?: string;
  color?: "default" | "blue" | "green" | "orange" | "red"; icon?: React.ReactNode;
}) {
  const colors = {
    default: "border-l-gray-400",
    blue: "border-l-brand-500",
    green: "border-l-green-500",
    orange: "border-l-orange-500",
    red: "border-l-red-500",
  };
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 border-l-4 shadow-sm p-4", colors[color])}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}

// Empty State
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      </div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// Loading
export function Loading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-brand-600"></div>
      <span className="ml-2 text-sm text-gray-500">{text}</span>
    </div>
  );
}

// Table helpers
export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full text-sm">{children}</table>;
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("text-left px-3 py-2 font-medium text-gray-500 border-b border-gray-200 bg-gray-50", className)}>{children}</th>;
}

export function TdWithStop({ children, className, onClick }: { children?: React.ReactNode; className?: string; onClick?: (e: any) => void }) {
  return <td className={cn("px-3 py-2 border-b border-gray-100 text-gray-700", className)} onClick={onClick}>{children}</td>;
}
export function Td({ children, className, onClick, colSpan }: { children?: React.ReactNode; className?: string; onClick?: (e: any) => void; colSpan?: number }) {
  return <td className={cn("px-3 py-2 border-b border-gray-100 text-gray-700", className)} onClick={onClick} colSpan={colSpan}>{children}</td>;
}

// Toast
export function useToast() {
  const [msg, setMsg] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const show = (type: "success" | "error" | "info", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };
  const ToastEl = msg ? (
    <div className={cn(
      "fixed top-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg text-sm text-white",
      msg.type === "success" && "bg-green-600", msg.type === "error" && "bg-red-600", msg.type === "info" && "bg-brand-600"
    )}>{msg.text}</div>
  ) : null;
  return { show, ToastEl };
}
