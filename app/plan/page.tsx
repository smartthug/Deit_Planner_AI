import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/mongoose";
import { DietPlan } from "@/models/DietPlan";
import type { DietPlanInput } from "@/lib/validation/groqDietPlan";
import { DietPlanInputSchema } from "@/lib/validation/groqDietPlan";
import type { GroqDietPlanOutput } from "@/lib/validation/groqDietPlan";
import PlanClient from "@/components/plan/PlanClient";
import { normalizeStoredFoodPreference } from "@/lib/validation/onboarding";
import type { OnboardingOutputs } from "@/models/User";

export const runtime = "nodejs";

function planDisplayName(email: string) {
  const local = email.split("@")[0]?.trim() || "You";
  if (!local) return "You";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function planBmi(weightKg?: number, heightCm?: number) {
  if (weightKg == null || heightCm == null || heightCm <= 0) return "—";
  const v = weightKg / (heightCm / 100) ** 2;
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(1);
}

function planActivityLabel(level?: string) {
  const m: Record<string, string> = {
    "No exercise": "home / beginner",
    "1-3": "gym / light",
    "3-5": "gym / intermediate",
    Daily: "gym / advanced",
  };
  return level ? (m[level] ?? level) : "—";
}

export default async function PlanPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  await connectToDatabase();

  const o = user.onboarding;
  const parsedInput = DietPlanInputSchema.safeParse({
    age: o.age,
    weightKg: o.weightKg,
    heightCm: o.heightCm,
    goal: o.goal,
    budget: o.budget,
    diet:
      normalizeStoredFoodPreference(o.foodPreference as string) ??
      o.foodPreference,
    cuisine: o.cuisine,
  });

  if (!parsedInput.success) {
    redirect("/onboarding");
  }

  const latest = await DietPlan.findOne({ userId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  const initialPlan =
    latest && latest._id
      ? {
          id: String(latest._id),
          input: latest.input as DietPlanInput,
          // Plain object — full Mongoose subdocs can be circular and break RSC serialization.
          output: latest.output as GroqDietPlanOutput,
          createdAt:
            latest.createdAt instanceof Date
              ? latest.createdAt.toISOString()
              : new Date(latest.createdAt as unknown as string).toISOString(),
        }
      : null;

  return (
    <PlanClient
      initialInput={parsedInput.data}
      initialPlan={initialPlan}
      initialSelections={(o.outputs ?? []) as OnboardingOutputs[]}
      planProfile={{
        displayName: planDisplayName(user.email),
        bmi: planBmi(o.weightKg, o.heightCm),
        goal: o.goal ?? "—",
        activity: planActivityLabel(o.activityLevel),
      }}
    />
  );
}

