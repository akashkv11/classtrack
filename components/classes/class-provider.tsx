"use client";

import { createContext, useContext } from "react";
import type { ClassContextValue } from "@/lib/types";

const ClassContext = createContext<ClassContextValue | null>(null);

export function ClassProvider({
  value,
  children,
}: {
  value: ClassContextValue;
  children: React.ReactNode;
}) {
  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
}

export function useClass() {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error("useClass must be used within a ClassProvider");
  }
  return context;
}

export function useOptionalClass() {
  return useContext(ClassContext);
}
