import { z } from "zod";

/** Groq often returns macros as strings ("120", "25g", "2,100"). Normalize to a number. */
export function coerceNonNegativeNumber(val: unknown): number | undefined {
  if (val == null || val === "") return undefined;
  if (typeof val === "number" && Number.isFinite(val)) return val < 0 ? undefined : val;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase().replace(/,/g, "");
    if (s === "") return undefined;
    const lead = s.match(/^(\d+(?:\.\d+)?)/);
    if (lead) {
      const n = Number(lead[1]);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    }
  }
  return undefined;
}

const requiredMacro = z.preprocess(
  (v) => {
    const n = coerceNonNegativeNumber(v);
    return n ?? v;
  },
  z.number().nonnegative(),
);

const optionalMacro = z.preprocess((v) => coerceNonNegativeNumber(v), z.number().nonnegative().optional());

export const GroqMealsSchema = z.object({
  breakfast: z.array(z.string()).length(7),
  lunch: z.array(z.string()).length(7),
  dinner: z.array(z.string()).length(7),
});

export const GroqDietPlanCoreSchema = z.object({
  calories: requiredMacro,
  protein: requiredMacro,
  carbs: requiredMacro,
  fats: optionalMacro,
  meals: GroqMealsSchema,
  grocery: z.array(z.string()),
  fruits: z.array(z.string()),
});

export const GroqDailyRoutineOnlySchema = z.object({
  dailyRoutine: z.string().min(200),
});

export const GroqDietPlanOutputSchema = z.object({
  calories: requiredMacro,
  protein: requiredMacro,
  carbs: requiredMacro,
  fats: optionalMacro,
  /** Multi-slot “choose one” day template. Empty string = legacy plan; otherwise must be detailed (≥200 chars). */
  dailyRoutine: z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z.union([z.literal(""), z.string().min(200)]),
  ),
  meals: GroqMealsSchema,
  grocery: z.array(z.string()),
  fruits: z.array(z.string()),
});

export type GroqDietPlanOutput = z.infer<typeof GroqDietPlanOutputSchema>;

// Client-provided input snapshot used for prompt building.
export const DietPlanInputSchema = z.object({
  age: z.number().int().min(10).max(120),
  weightKg: z.number().int().min(20).max(300),
  heightCm: z.number().int().min(80).max(260),
  goal: z.enum(["Weight Loss", "Muscle Gain", "Maintain"]),
  budget: z.enum(["Low", "Medium", "High"]),
  diet: z.preprocess(
    (v) => (v === "Eggetarian" ? "Vegan" : v),
    z.enum(["Veg", "Non-veg", "Vegan"]),
  ),
  cuisine: z.enum(["Tamil", "Indian", "Mixed"]),
});

export type DietPlanInput = z.infer<typeof DietPlanInputSchema>;

