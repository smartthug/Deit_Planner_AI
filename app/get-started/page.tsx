import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export default async function GetStartedPage() {
  const user = await getUserFromSession();

  if (user) {
    redirect("/onboarding");
  }

  redirect("/login");
}
