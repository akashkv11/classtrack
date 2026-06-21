import { useEffect } from "react";

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError")
  );
}

export function useClientEffect(
  effect: (signal: AbortSignal) => void | Promise<void>,
  deps: readonly unknown[],
) {
  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve(effect(controller.signal)).catch((error: unknown) => {
      if (isAbortError(error)) return;
      console.error(error);
    });

    return () => controller.abort();
    // deps are supplied by each caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
