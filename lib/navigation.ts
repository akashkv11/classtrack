export type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Home", match: (path) => path === "/dashboard" },
  {
    href: "/classes",
    label: "Classes",
    match: (path) => path === "/classes" || path.startsWith("/classes/"),
  },
];

export function navLinkClassName(active: boolean) {
  return active
    ? "bg-blue-50 text-blue-700"
    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900";
}
