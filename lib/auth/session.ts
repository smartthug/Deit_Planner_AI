import crypto from "crypto";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { connectToDatabase, isDatabaseUnreachableError } from "@/lib/mongoose";
import { Session } from "@/models/Session";
import { User, UserDocument } from "@/models/User";

const COOKIE_NAME = "dietai_sid";

function getSessionTtlMs(): number {
  const raw = process.env.AUTH_SESSION_TTL_MS;
  if (!raw) return 7 * 24 * 60 * 60 * 1000; // 7 days
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid AUTH_SESSION_TTL_MS env var");
  }
  return parsed;
}

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

export function setSessionCookie(
  res: NextResponse,
  sessionId: string,
  expiresAt: Date,
) {
  res.cookies.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function createSession(
  userId: mongoose.Types.ObjectId | string,
) {
  await connectToDatabase();

  const sessionTtlMs = getSessionTtlMs();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionTtlMs);

  await Session.create({
    sessionId,
    userId,
    expiresAt,
  });

  return { sessionId, expiresAt };
}

export async function getUserFromSession(): Promise<UserDocument | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;

  try {
    await connectToDatabase();

    const session = await Session.findOne({
      sessionId,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return null;
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return null;
    }

    return user;
  } catch (err) {
    if (isDatabaseUnreachableError(err)) {
      console.error("[session] MongoDB unreachable:", err);
      return null;
    }
    throw err;
  }
}

export async function deleteSession(sessionId: string) {
  await connectToDatabase();
  await Session.deleteOne({ sessionId });
}

export async function getSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

