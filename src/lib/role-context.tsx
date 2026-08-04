"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import type { RoleUser } from "@/types";

interface RoleContextValue {
  user: RoleUser | null;
  setUser: (u: RoleUser | null) => void;
  isDemoMode: boolean;
  setDemoMode: (v: boolean) => void;
}

const RoleContext = createContext<RoleContextValue>({
  user: null, setUser: () => {}, isDemoMode: false, setDemoMode: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<RoleUser | null>(null);
  const [isDemoMode, setDemoModeState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("roleUser");
    if (stored) setUserState(JSON.parse(stored));
    const demo = localStorage.getItem("demoMode");
    if (demo === "true") setDemoModeState(true);
  }, []);

  const setUser = (u: RoleUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem("roleUser", JSON.stringify(u));
    else localStorage.removeItem("roleUser");
  };
  const setDemoMode = (v: boolean) => {
    setDemoModeState(v);
    localStorage.setItem("demoMode", v ? "true" : "false");
  };

  return (
    <RoleContext.Provider value={{ user, setUser, isDemoMode, setDemoMode }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
