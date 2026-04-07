import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import {
  clearCookie,
  deleteSession,
  getSessionIdFromCookie,
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    await connectToDatabase();

    const sessionId = await getSessionIdFromCookie();
    const res = NextResponse.json({ ok: true });
    if (!sessionId) {
      clearCookie(res);
      return res;
    }

    await deleteSession(sessionId);
    clearCookie(res);

    return res;
  } catch {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

