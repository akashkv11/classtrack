"use client";

import { useState } from "react";
import AppTopBar from "@/components/layout/app-top-bar";
import MobileNavDrawer from "@/components/layout/mobile-nav-drawer";
import Sidebar from "@/components/layout/sidebar";

type ShellChromeProps = {
  children: React.ReactNode;
};

export default function ShellChrome({ children }: ShellChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar onMenuClick={() => setMenuOpen(true)} />
        <div className="flex-1">{children}</div>
      </div>
      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
