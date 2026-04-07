import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth/session";
import OnboardingFormClient from "@/components/onboarding/OnboardingFormClient";
import type { OnboardingStepIndex } from "@/models/User";
import { normalizeStoredFoodPreference } from "@/lib/validation/onboarding";

export const runtime = "nodejs";

export default async function OnboardingPage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  const o = user.onboarding;
  const initialStep = Math.max(0, Math.min(6, o.currentStep)) as OnboardingStepIndex;
  const initialOnboarding = {
    age: o.age,
    gender: o.gender,
    heightCm: o.heightCm,
    weightKg: o.weightKg,
    goal: o.goal,
    activityLevel: o.activityLevel,
    foodPreference:
      normalizeStoredFoodPreference(o.foodPreference as string) ??
      o.foodPreference,
    cuisine: o.cuisine,
    budget: o.budget,
    wakeTime: o.wakeTime,
    sleepTime: o.sleepTime,
    workoutTime: o.workoutTime,
    outputs: o.outputs ?? [],
  };

  return (
    <OnboardingFormClient
      initialStep={initialStep}
      initialOnboarding={initialOnboarding}
    />
  );
}

