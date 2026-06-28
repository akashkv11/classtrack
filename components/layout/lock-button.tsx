"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LockButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  async function handleLock() {
    await fetch("/api/auth/lock", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleLock} className={className}>
      Lock
    </Button>
  );
}
