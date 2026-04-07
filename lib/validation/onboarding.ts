import { z } from "zod";

/** DB may still have legacy `Eggetarian`; treat as Vegan everywhere. */
export function normalizeStoredFoodPreference(
  v: string | undefined | null,
): "Veg" | "Non-veg" | "Vegan" | undefined {
  if (v == null) return undefined;
  if (v === "Eggetarian") return "Vegan";
  if (v === "Veg" || v === "Non-veg" || v === "Vegan") return v;
  return undefined;
}

const genderOptions = ["Male", "Female", "Other"] as const;
const goalOptions = ["Weight Loss", "Muscle Gain", "Maintain"] as const;
const activityOptions = ["No exercise", "1-3", "3-5", "Daily"] as const;
const foodPreferenceOptions = ["Veg", "Non-veg", "Vegan"] as const;
const cuisineOptions = ["Tamil", "Indian", "Mixed"] as const;
const budgetOptions = ["Low", "Medium", "High"] as const;
const outputsOptions = [
  "Daily Plan",
  "Weekly Plan",
  "Grocery List",
  "Calories Breakdown",
] as const;

export const Step1DataSchema = z.object({
  age: z.number().int().min(10).max(100),
  gender: z.enum(genderOptions),
  heightCm: z.number().int().min(120).max(230),
  weightKg: z.number().int().min(30).max(250),
});

export const Step2DataSchema = z.object({
  goal: z.enum(goalOptions),
});

export const Step3DataSchema = z.object({
  activityLevel: z.enum(activityOptions),
});

export const Step4DataSchema = z.object({
  foodPreference: z.preprocess(
    (v) => (v === "Eggetarian" ? "Vegan" : v),
    z.enum(foodPreferenceOptions),
  ),
  cuisine: z.enum(cuisineOptions),
});

export const Step5DataSchema = z.object({
  budget: z.enum(budgetOptions),
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
export const Step6DataSchema = z.object({
  wakeTime: z.string().regex(timeRegex, "Use HH:MM (24h) format"),
  sleepTime: z.string().regex(timeRegex, "Use HH:MM (24h) format"),
  workoutTime: z.string().regex(timeRegex, "Use HH:MM (24h) format"),
});

export const Step7DataSchema = z.object({
  outputs: z.array(z.enum(outputsOptions)).min(1),
});

export const onboardingStepDataSchemas = [
  Step1DataSchema,
  Step2DataSchema,
  Step3DataSchema,
  Step4DataSchema,
  Step5DataSchema,
  Step6DataSchema,
  Step7DataSchema,
] as const;

export const OnboardingSavePayloadSchema = z.object({
  step: z.number().int().min(0).max(6),
  data: z.unknown(),
});

