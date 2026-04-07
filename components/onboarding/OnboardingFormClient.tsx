"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ActivityLevelOption,
  BudgetOption,
  CuisineOption,
  FoodPreferenceOption,
  GenderOption,
  GoalOption,
  OnboardingOutputs,
  OnboardingStepIndex,
} from "@/models/User";
import {
  normalizeStoredFoodPreference,
  onboardingStepDataSchemas,
  OnboardingSavePayloadSchema,
} from "@/lib/validation/onboarding";

type StepValues = {
  age?: number;
  gender?: GenderOption;
  heightCm?: number;
  weightKg?: number;

  goal?: GoalOption;
  activityLevel?: ActivityLevelOption;

  foodPreference?: FoodPreferenceOption;
  cuisine?: CuisineOption;

  budget?: BudgetOption;

  wakeTime?: string; // "HH:MM"
  sleepTime?: string; // "HH:MM"
  workoutTime?: string; // "HH:MM"

  outputs?: OnboardingOutputs[];
};

type Props = {
  initialStep?: OnboardingStepIndex;
  initialOnboarding?: StepValues;
};

const stepTitles: string[] = [
  "Body basics",
  "Your goal",
  "Activity level",
  "Food preferences",
  "Budget",
  "Routine times",
  "Plan contents",
];

const outputsOptions: OnboardingOutputs[] = [
  "Daily Plan",
  "Weekly Plan",
  "Grocery List",
  "Calories Breakdown",
];

const OUTPUT_DETAILS: Record<
  OnboardingOutputs,
  { title: string; description: string }
> = {
  "Daily Plan": {
    title: "Daily plan",
    description: "Meal structure and options for each day",
  },
  "Weekly Plan": {
    title: "Weekly overview",
    description: "All seven days in one place",
  },
  "Grocery List": {
    title: "Grocery list",
    description: "Weekly shopping with ₹ estimates",
  },
  "Calories Breakdown": {
    title: "Calories breakdown",
    description: "Targets for calories, protein, carbs, and fats",
  },
};

function OutputCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type TimePreset = { value: string; label: string };

function hhmmToPretty12h(hhmm: string): string | null {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [hs, ms] = hhmm.split(":");
  const h = Number(hs);
  const m = Number(ms);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

const WAKE_PRESETS: TimePreset[] = [
  { value: "05:30", label: "5:30 AM" },
  { value: "06:00", label: "6:00 AM" },
  { value: "06:30", label: "6:30 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "07:30", label: "7:30 AM" },
  { value: "08:00", label: "8:00 AM" },
];

const SLEEP_PRESETS: TimePreset[] = [
  { value: "21:00", label: "9:00 PM" },
  { value: "21:30", label: "9:30 PM" },
  { value: "22:00", label: "10:00 PM" },
  { value: "22:30", label: "10:30 PM" },
  { value: "23:00", label: "11:00 PM" },
  { value: "23:30", label: "11:30 PM" },
];

const WORKOUT_PRESETS: TimePreset[] = [
  { value: "06:00", label: "6:00 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
];

function RoutineTimeCard({
  id,
  title,
  hint,
  value,
  onChange,
  presets,
  error,
}: {
  id: string;
  title: string;
  hint: string;
  value: string | undefined;
  onChange: (v: string) => void;
  presets: TimePreset[];
  error?: string;
}) {
  const pretty = value ? hhmmToPretty12h(value) : null;
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/60 p-4 sm:p-5 dark:border-white/10 dark:bg-black/30">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {hint}
          </p>
        </div>
        {pretty ? (
          <span className="shrink-0 text-sm font-semibold text-[#950101] dark:text-[#FF0000]">
            {pretty}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-500">
        Quick pick
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={[
              "rounded-xl border px-3 py-2 text-xs font-semibold transition",
              value === p.value
                ? "border-[#FF0000]/40 bg-[#FF0000]/10 text-[#950101] dark:border-[#FF0000]/30 dark:bg-[#FF0000]/10 dark:text-[#FF0000]"
                : "border-zinc-200/70 bg-white/80 text-zinc-800 hover:border-[#FF0000]/30 dark:border-white/10 dark:bg-black/40 dark:text-zinc-200 dark:hover:border-[#FF0000]/40",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
        Or set exactly
        <input
          id={id}
          type="time"
          step={300}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full min-h-[3rem] rounded-2xl border border-zinc-200/70 bg-white/90 px-4 py-3 text-base font-medium tabular-nums outline-none transition focus:border-[#FF0000]/40 focus:ring-2 focus:ring-[#FF0000]/15 dark:border-white/10 dark:bg-black/40 dark:text-zinc-50"
        />
      </label>

      {error ? (
        <div className="mt-2 text-xs font-semibold text-[#950101] dark:text-[#FF0000]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

const TOTAL_STEPS = 7;

export default function OnboardingFormClient({
  initialStep,
  initialOnboarding,
}: Props) {
  const router = useRouter();

  const clampStep = (step: number) =>
    Math.max(0, Math.min(TOTAL_STEPS - 1, step));

  const [currentStep, setCurrentStep] = useState<OnboardingStepIndex>(
    clampStep(initialStep ?? 0) as OnboardingStepIndex,
  );
  const [values, setValues] = useState<StepValues>({
    outputs: [],
    ...(initialOnboarding ?? {}),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const safeStep = useMemo(() => {
    return clampStep(currentStep) as OnboardingStepIndex;
  }, [currentStep]);

  const progressPct = useMemo(() => {
    return ((safeStep + 1) / TOTAL_STEPS) * 100;
  }, [safeStep]);

  useEffect(() => {
    // Resume support: if server didn't provide data, fetch it.
    if (initialStep !== undefined && initialOnboarding !== undefined) return;

    let cancelled = false;
    (async () => {
      const res = await fetch("/api/onboarding/get", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return;
      const payload = (await res.json()) as {
        currentStep: number;
        onboarding: StepValues;
      };
      if (cancelled) return;
      setCurrentStep(clampStep(payload.currentStep) as OnboardingStepIndex);
      const ob = payload.onboarding ?? {};
      setValues({
        ...ob,
        outputs: ob.outputs ?? [],
        foodPreference:
          normalizeStoredFoodPreference(ob.foodPreference as string) ??
          ob.foodPreference,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [initialStep, initialOnboarding]);

  function buildStepData(step: OnboardingStepIndex) {
    switch (step) {
      case 0:
        return {
          age: values.age,
          gender: values.gender,
          heightCm: values.heightCm,
          weightKg: values.weightKg,
        };
      case 1:
        return { goal: values.goal };
      case 2:
        return { activityLevel: values.activityLevel };
      case 3:
        return { foodPreference: values.foodPreference, cuisine: values.cuisine };
      case 4:
        return { budget: values.budget };
      case 5:
        return {
          wakeTime: values.wakeTime,
          sleepTime: values.sleepTime,
          workoutTime: values.workoutTime,
        };
      case 6:
        return { outputs: values.outputs ?? [] };
      default:
        return {};
    }
  }

  function mapZodErrors(err: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = String(issue.path?.[0] ?? "form");
      out[key] = issue.message;
    }
    return out;
  }

  async function saveCurrentStep(step: OnboardingStepIndex) {
    setGeneralError(null);
    setFieldErrors({});
    setIsSaving(true);

    const stepData = buildStepData(step);
    const schema = onboardingStepDataSchemas[step];
    const parsed = schema.safeParse(stepData);
    if (!parsed.success) {
      setFieldErrors(mapZodErrors(parsed.error));
      setIsSaving(false);
      return;
    }

    const payload = {
      step,
      data: parsed.data,
    };

    const payloadParsed = OnboardingSavePayloadSchema.safeParse(payload);
    // This shouldn't fail because step is already bounded and we validate data above.
    if (!payloadParsed.success) {
      setGeneralError("Invalid save payload.");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/onboarding/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => null))?.error ??
          "Failed to save step.";
        setGeneralError(msg);
        return;
      }

      const resp = (await res.json().catch(() => null)) as
        | { currentStep?: number }
        | null;

      const next = resp?.currentStep ?? (step === 6 ? 6 : step + 1);
      setCurrentStep(clampStep(next) as OnboardingStepIndex);

      if (step === 6) {
        router.push("/plan");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const step = safeStep;
  const nextLabel = step === 6 ? "Finish" : "Next";

  function goBack() {
    if (isSaving) return;
    if (step <= 0) return;
    setFieldErrors({});
    setGeneralError(null);
    setCurrentStep((s) => clampStep(s - 1) as OnboardingStepIndex);
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Onboarding
              </h1>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                Step {step + 1} of 7: {stepTitles[step]}
              </p>
            </div>
            <div className="sm:text-right">
              <div className="text-xs font-semibold text-[#950101] dark:text-[#FF0000]">
                {Math.round(progressPct)}%
              </div>
              <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-zinc-200/60 sm:w-40 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#FF0000]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <StepContent
                  step={step}
                  values={values}
                  fieldErrors={fieldErrors}
                  onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {generalError && (
            <div className="mt-5 rounded-2xl border border-[#FF0000]/20 bg-[#FF0000]/10 p-4 text-sm font-semibold text-[#950101] dark:bg-[#950101]/10 dark:text-[#FF0000]">
              {generalError}
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={isSaving || step <= 0}
              onClick={goBack}
              className="w-full rounded-2xl border border-zinc-200/70 bg-white/60 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[#FF0000]/40 sm:w-auto dark:border-white/10 dark:bg-black/30 dark:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                void saveCurrentStep(step);
              }}
              className="w-full rounded-2xl bg-[#FF0000] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#950101] sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : nextLabel}
            </button>
          </div>

          {step === 6 && (
            <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-300">
              After finishing, we’ll take you to your generated plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {children}
      </div>
    </div>
  );
}

const choiceBtnBase =
  "min-h-[44px] min-w-[5.5rem] flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition";

function choiceButtonClass(selected: boolean, opts?: { multiline?: boolean }) {
  return [
    choiceBtnBase,
    opts?.multiline
      ? "min-h-[3.25rem] whitespace-normal text-left leading-snug sm:text-center"
      : "",
    selected
      ? "border-[#FF0000]/40 bg-[#FF0000]/10 text-[#950101] dark:border-[#FF0000]/30 dark:bg-[#FF0000]/10 dark:text-[#FF0000]"
      : "border-zinc-200/70 bg-white/60 text-zinc-900 hover:border-[#FF0000]/40 dark:border-white/10 dark:bg-black/30 dark:text-zinc-50 dark:hover:border-[#FF0000]/50",
  ]
    .filter(Boolean)
    .join(" ");
}

function ChoiceButtons<V extends string>({
  label,
  value,
  options,
  onSelect,
  error,
  multiline,
  stackOnNarrow,
}: {
  label: string;
  value: V | undefined;
  options: readonly { value: V; label: string }[];
  onSelect: (v: V) => void;
  error?: string;
  /** Long labels wrap cleanly (e.g. vegan description). */
  multiline?: boolean;
  /** Full-width stacked buttons on small screens. */
  stackOnNarrow?: boolean;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {label}
      </legend>
      <div
        className={
          stackOnNarrow
            ? "flex flex-col gap-2 sm:flex sm:flex-row sm:flex-wrap"
            : "flex flex-wrap gap-2"
        }
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onSelect(opt.value)}
            className={choiceButtonClass(value === opt.value, { multiline })}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error ? (
        <div className="text-xs font-semibold text-[#950101] dark:text-[#FF0000]">{error}</div>
      ) : null}
    </fieldset>
  );
}

function StepContent({
  step,
  values,
  fieldErrors,
  onChange,
}: {
  step: OnboardingStepIndex;
  values: StepValues;
  fieldErrors: Record<string, string>;
  onChange: (patch: Partial<StepValues>) => void;
}) {
  const getErr = (key: string) => fieldErrors[key];

  const inputClassName =
    "w-full rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[#FF0000]/40 focus:ring-0 dark:border-white/10 dark:bg-black/30";

  switch (step) {
    case 0:
      return (
        <div className="space-y-5">
          <SectionTitle>Body basics</SectionTitle>

          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="age">
              Age
            </label>
            <input
              id="age"
              type="number"
              min={10}
              max={100}
              value={values.age ?? ""}
              onChange={(e) =>
                onChange({
                  age: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className={inputClassName}
            />
            {getErr("age") && (
              <div className="text-xs font-semibold text-[#950101] dark:text-[#FF0000]">
                {getErr("age")}
              </div>
            )}
          </div>

          <ChoiceButtons<GenderOption>
            label="Gender"
            value={values.gender}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
            onSelect={(gender) => onChange({ gender })}
            error={getErr("gender")}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="heightCm">
                Height (cm)
              </label>
              <input
                id="heightCm"
                type="number"
                min={120}
                max={230}
                value={values.heightCm ?? ""}
                onChange={(e) =>
                  onChange({
                    heightCm:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                className={inputClassName}
              />
              {getErr("heightCm") && (
                <div className="text-xs font-semibold text-[#950101] dark:text-[#FF0000]">
                  {getErr("heightCm")}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="weightKg">
                Weight (kg)
              </label>
              <input
                id="weightKg"
                type="number"
                min={30}
                max={250}
                value={values.weightKg ?? ""}
                onChange={(e) =>
                  onChange({
                    weightKg:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                className={inputClassName}
              />
              {getErr("weightKg") && (
                <div className="text-xs font-semibold text-[#950101] dark:text-[#FF0000]">
                  {getErr("weightKg")}
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 1:
      return (
        <div className="space-y-5">
          <SectionTitle>Your goal</SectionTitle>
          <ChoiceButtons<GoalOption>
            label="Goal"
            value={values.goal}
            options={[
              { value: "Weight Loss", label: "Weight Loss" },
              { value: "Muscle Gain", label: "Muscle Gain" },
              { value: "Maintain", label: "Maintain" },
            ]}
            onSelect={(goal) => onChange({ goal })}
            error={getErr("goal")}
          />
        </div>
      );

    case 2:
      return (
        <div className="space-y-5">
          <ChoiceButtons<ActivityLevelOption>
            label="Activity level"
            value={values.activityLevel}
            options={[
              { value: "No exercise", label: "No exercise" },
              { value: "1-3", label: "1–3 days / week" },
              { value: "3-5", label: "3–5 days / week" },
              { value: "Daily", label: "Daily" },
            ]}
            onSelect={(activityLevel) => onChange({ activityLevel })}
            error={getErr("activityLevel")}
          />
        </div>
      );

    case 3:
      return (
        <div className="space-y-5">
          <SectionTitle>Food preferences</SectionTitle>
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
            <ChoiceButtons<FoodPreferenceOption>
              label="Preference"
              value={values.foodPreference}
              options={[
                { value: "Veg", label: "Veg" },
                { value: "Non-veg", label: "Non-veg" },
                {
                  value: "Vegan",
                  label: "Vegan (no milk, no egg)",
                },
              ]}
              onSelect={(foodPreference) => onChange({ foodPreference })}
              error={getErr("foodPreference")}
              multiline
              stackOnNarrow
            />
            <ChoiceButtons<CuisineOption>
              label="Style"
              value={values.cuisine}
              options={[
                { value: "Tamil", label: "North Indian" },
                { value: "Indian", label: "South Indian" },
                { value: "Mixed", label: "Mixed" },
              ]}
              onSelect={(cuisine) => onChange({ cuisine })}
              error={getErr("cuisine")}
              stackOnNarrow
            />
          </div>
        </div>
      );

    case 4:
      return (
        <div className="space-y-5">
          <ChoiceButtons<BudgetOption>
            label="Budget"
            value={values.budget}
            options={[
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
            ]}
            onSelect={(budget) => onChange({ budget })}
            error={getErr("budget")}
          />
        </div>
      );

    case 5:
      return (
        <div className="space-y-5">
          <SectionTitle>Routine times</SectionTitle>
          <p className="-mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Tap a common time or use the picker to adjust. Times are saved in 24-hour form;
            we show a 12-hour summary next to each field.
          </p>
          <div className="flex flex-col gap-5">
            <RoutineTimeCard
              id="wakeTime"
              title="Wake up"
              hint="When you usually get up on a typical day."
              value={values.wakeTime}
              onChange={(wakeTime) => onChange({ wakeTime })}
              presets={WAKE_PRESETS}
              error={getErr("wakeTime")}
            />
            <RoutineTimeCard
              id="sleepTime"
              title="Sleep"
              hint="When you aim to be in bed and lights out."
              value={values.sleepTime}
              onChange={(sleepTime) => onChange({ sleepTime })}
              presets={SLEEP_PRESETS}
              error={getErr("sleepTime")}
            />
            <RoutineTimeCard
              id="workoutTime"
              title="Workout"
              hint="Your usual training window (adjust any day in your plan)."
              value={values.workoutTime}
              onChange={(workoutTime) => onChange({ workoutTime })}
              presets={WORKOUT_PRESETS}
              error={getErr("workoutTime")}
            />
          </div>
        </div>
      );

    case 6: {
      const selected = values.outputs ?? [];
      return (
        <div className="space-y-5">
          <SectionTitle>What to include</SectionTitle>
          <p className="-mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Tap a card to add or remove it. Pick at least one — most people keep all four.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {outputsOptions.map((opt) => {
              const checked = selected.includes(opt);
              const meta = OUTPUT_DETAILS[opt];
              return (
                <button
                  key={opt}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => {
                    const next = checked
                      ? selected.filter((x) => x !== opt)
                      : [...selected, opt];
                    onChange({ outputs: next });
                  }}
                  className={[
                    "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition",
                    checked
                      ? "border-[#FF0000]/45 bg-[#FF0000]/10 shadow-sm dark:border-[#FF0000]/35 dark:bg-[#FF0000]/15"
                      : "border-zinc-200/80 bg-white/70 hover:border-[#FF0000]/25 hover:bg-white dark:border-white/10 dark:bg-black/30 dark:hover:border-[#FF0000]/30 dark:hover:bg-black/45",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition",
                      checked
                        ? "border-[#FF0000] bg-[#FF0000] text-white"
                        : "border-zinc-300/80 bg-white text-transparent dark:border-white/20 dark:bg-black/50",
                    ].join(" ")}
                  >
                    <OutputCheckIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {meta.title}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-zinc-600 dark:text-zinc-400">
                      {meta.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {getErr("outputs") ? (
            <div className="text-xs font-semibold text-[#950101] dark:text-[#FF0000]">
              {getErr("outputs")}
            </div>
          ) : null}
        </div>
      );
    }

    default:
      return null;
  }
}

