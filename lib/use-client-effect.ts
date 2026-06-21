import { useEffect } from "react";

export function useClientEffect(
  effect: (signal: AbortSignal) => void | Promise<void>,
  deps: readonly unknown[],
) {
  useEffect(() => {
    const controller = new AbortController();
    void effect(controller.signal);
    return () => controller.abort();
    // deps are supplied by each caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
