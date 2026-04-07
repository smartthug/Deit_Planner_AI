import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    onboarding: user.onboarding,
    currentStep: user.onboarding.currentStep,
  });
}

