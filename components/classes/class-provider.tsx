"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ClassContextValue } from "@/lib/types";

export type ClassMeta = Omit<ClassContextValue, "classId">;

const defaultMeta: ClassMeta = {
  displayName: "Class",
  whatsappNumber: null,
  whatsappChannelUrl: null,
};

const ClassContext = createContext<ClassContextValue | null>(null);
const ClassMetaSetterContext = createContext<((meta: ClassMeta) => void) | null>(
  null,
);

export function ClassProvider({
  classId,
  children,
}: {
  classId: string;
  children: React.ReactNode;
}) {
  const [meta, setMeta] = useState(defaultMeta);

  const value: ClassContextValue = {
    classId,
    ...meta,
  };

  return (
    <ClassMetaSetterContext.Provider value={setMeta}>
      <ClassContext.Provider value={value}>{children}</ClassContext.Provider>
    </ClassMetaSetterContext.Provider>
  );
}

export function ClassMetaSync({ meta }: { meta: ClassMeta }) {
  const setMeta = useContext(ClassMetaSetterContext);

  useEffect(() => {
    setMeta?.(meta);
  }, [meta, setMeta]);

  return null;
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
