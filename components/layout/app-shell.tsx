import ShellChrome from "@/components/layout/shell-chrome";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return <ShellChrome>{children}</ShellChrome>;
}
