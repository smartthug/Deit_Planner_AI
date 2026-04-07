import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongoose";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { User } from "@/models/User";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const json = (await req.json()) as unknown;
    const parsed = LoginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { sessionId, expiresAt } = await createSession(user._id);
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, sessionId, expiresAt);
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

