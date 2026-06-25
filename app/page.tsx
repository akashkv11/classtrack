import { redirect } from "next/navigation";
import PasswordGate from "@/components/auth/password-gate";
import { isAuthenticated } from "@/lib/auth";

export default async function HomePage() {
  if (await isAuthenticated()) {
    redirect("/today");
  }

  return <PasswordGate />;
}
