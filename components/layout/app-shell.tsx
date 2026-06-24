import AppTopBar from "@/components/layout/app-top-bar";
import Sidebar from "@/components/layout/sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
