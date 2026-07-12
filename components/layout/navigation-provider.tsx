"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NavigationProgress from "@/components/layout/navigation-progress";

type NavigationContextValue = {
  isNavigating: boolean;
  pendingHref: string | null;
};

const NavigationContext = createContext<NavigationContextValue>({
  isNavigating: false,
  pendingHref: null,
});

export function useNavigation() {
  return useContext(NavigationContext);
}

function hrefFromLocation(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const currentLocation = hrefFromLocation(pathname, searchParams);
  const isNavigating = pendingHref !== null && pendingHref !== currentLocation;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor) return;
      if (anchor.getAttribute("target") === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const next = `${url.pathname}${url.search}`;
      const current = hrefFromLocation(pathname, searchParams);
      if (next === current) return;

      setPendingHref(next);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, searchParams]);

  return (
    <NavigationContext.Provider
      value={{ isNavigating, pendingHref: isNavigating ? pendingHref : null }}
    >
      {children}
      <NavigationProgress active={isNavigating} />
    </NavigationContext.Provider>
  );
}
