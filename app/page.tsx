import { redirect } from "next/navigation";
import PasswordGate from "@/components/PasswordGate";
import { isAuthenticated } from "@/lib/auth";

export default async function HomePage() {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return <PasswordGate />;
}
