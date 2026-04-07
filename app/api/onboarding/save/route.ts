import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/session";
import {
  OnboardingSavePayloadSchema,
  onboardingStepDataSchemas,
} from "@/lib/validation/onboarding";
import type {
  ActivityLevelOption,
  BudgetOption,
  CuisineOption,
  FoodPreferenceOption,
  GenderOption,
  GoalOption,
  OnboardingOutputs,
  OnboardingStepIndex,
} from "@/models/User";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = (await req.json()) as unknown;
    const parsedPayload = OnboardingSavePayloadSchema.safeParse(json);
    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsedPayload.error.flatten() },
        { status: 400 },
      );
    }

    const step = parsedPayload.data.step;
    const dataSchema = onboardingStepDataSchemas[step];
    const parsedData = dataSchema.safeParse(parsedPayload.data.data);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: "Invalid step data", details: parsedData.error.flatten() },
        { status: 400 },
      );
    }

    const newCurrentStep = (step === 6 ? 6 : step + 1) as OnboardingStepIndex;
    user.onboarding.updatedAt = new Date();
    user.onboarding.currentStep = newCurrentStep;

    switch (step) {
      case 0: {
        const d = parsedData.data as {
          age: number;
          gender: GenderOption;
          heightCm: number;
          weightKg: number;
        };
        user.onboarding.age = d.age;
        user.onboarding.gender = d.gender;
        user.onboarding.heightCm = d.heightCm;
        user.onboarding.weightKg = d.weightKg;
        break;
      }
      case 1: {
        const d = parsedData.data as { goal: GoalOption };
        user.onboarding.goal = d.goal;
        break;
      }
      case 2: {
        const d = parsedData.data as { activityLevel: ActivityLevelOption };
        user.onboarding.activityLevel = d.activityLevel;
        break;
      }
      case 3: {
        const d = parsedData.data as {
          foodPreference: FoodPreferenceOption;
          cuisine: CuisineOption;
        };
        user.onboarding.foodPreference = d.foodPreference;
        user.onboarding.cuisine = d.cuisine;
        break;
      }
      case 4: {
        const d = parsedData.data as { budget: BudgetOption };
        user.onboarding.budget = d.budget;
        break;
      }
      case 5: {
        const d = parsedData.data as {
          wakeTime: string;
          sleepTime: string;
          workoutTime: string;
        };
        user.onboarding.wakeTime = d.wakeTime;
        user.onboarding.sleepTime = d.sleepTime;
        user.onboarding.workoutTime = d.workoutTime;
        break;
      }
      case 6: {
        const d = parsedData.data as { outputs: OnboardingOutputs[] };
        user.onboarding.outputs = d.outputs;
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown step" }, { status: 400 });
    }

    await user.save();

    return NextResponse.json({
      ok: true,
      currentStep: user.onboarding.currentStep,
    });
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

