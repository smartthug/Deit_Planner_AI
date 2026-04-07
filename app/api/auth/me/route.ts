import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      onboarding: user.onboarding,
    },
  });
}

