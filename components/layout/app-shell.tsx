import AppTopBar from "@/components/layout/app-top-bar";
import MobileNav from "@/components/layout/mobile-nav";
import Sidebar from "@/components/layout/sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(3.25rem+env(safe-area-inset-bottom))] lg:pb-0">
        <AppTopBar />
        <div className="flex-1">{children}</div>
      </div>
      <MobileNav />
    </div>
  );
}
