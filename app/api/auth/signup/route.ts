import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongoose";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { User } from "@/models/User";

export const runtime = "nodejs";

const SignupSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const json = (await req.json()) as unknown;
    const parsed = SignupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const { email, password } = parsed.data;
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      onboarding: {
        updatedAt: new Date(),
        currentStep: 0,
        outputs: [],
      },
    });

    const { sessionId, expiresAt } = await createSession(user._id);
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, sessionId, expiresAt);
    return res;
  } catch {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}

