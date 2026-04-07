import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/mongoose";
import { DietPlan } from "@/models/DietPlan";
import { DietPlanInputSchema } from "@/lib/validation/groqDietPlan";
import { generateGroqDietPlan } from "@/lib/ai/groqDietPlan";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = (await req.json()) as unknown;
    const parsed = DietPlanInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const output = await generateGroqDietPlan(parsed.data);

    const plan = await DietPlan.create({
      userId: user._id,
      input: parsed.data,
      output,
    });

    return NextResponse.json({
      ok: true,
      plan: {
        id: plan._id.toString(),
        input: plan.input,
        output: plan.output,
        createdAt: plan.createdAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

