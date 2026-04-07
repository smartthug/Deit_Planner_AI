import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/mongoose";
import { DietPlan } from "@/models/DietPlan";

export const runtime = "nodejs";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const latest = await DietPlan.findOne({ userId: user._id }).sort({
    createdAt: -1,
  });

  if (!latest) {
    return NextResponse.json({ plan: null }, { status: 404 });
  }

  return NextResponse.json({
    plan: {
      id: latest._id.toString(),
      input: latest.input,
      output: latest.output,
      createdAt: latest.createdAt,
    },
  });
}

