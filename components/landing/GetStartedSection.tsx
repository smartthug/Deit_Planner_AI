"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

type Goal = "Fat Loss" | "Muscle Gain" | "Healthy Lifestyle";

export default function GetStartedSection() {
  const [goal, setGoal] = useState<Goal>("Fat Loss");
  const [budget, setBudget] = useState(12);
  const [age, setAge] = useState(28);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(72);
  const [activity, setActivity] = useState<"Low" | "Moderate" | "High">("Moderate");

  const [status, setStatus] = useState<"idle" | "generating" | "ready">("idle");

  const preview = useMemo(() => {
    // Lightweight, deterministic preview (no backend yet).
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const factor = activity === "Low" ? 1.35 : activity === "High" ? 1.7 : 1.55;
    const tdee = base * factor;

    const calories =
      goal === "Fat Loss" ? tdee - 350 : goal === "Muscle Gain" ? tdee + 250 : tdee;

    const rounded = Math.max(1400, Math.round(calories / 50) * 50);
    return {
      calories: rounded,
      proteinG: Math.round((rounded * 0.34) / 4),
      carbsG: Math.round((rounded * 0.41) / 4),
      fatG: Math.round((rounded * 0.25) / 9),
    };
  }, [activity, age, goal, heightCm, weightKg]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "generating") return;
    setStatus("generating");

    window.setTimeout(() => {
      setStatus("ready");
    }, 1300);
  };

  return (
    <section className="relative" id="get-started">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Get your personalized plan
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Enter your goal and body details. We will generate meals, grocery list, and a
              nutrition breakdown you can trust.
            </p>
          </div>
          <div className="rounded-2xl border border-[#FF0000]/20 bg-[#FF0000]/10 px-4 py-2 text-sm text-[#950101] dark:bg-[#950101]/10 dark:text-[#FF0000]">
            Groceries built around your budget
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30 lg:p-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Your details
              </h3>
              <div className="text-xs font-medium text-[#950101] dark:text-[#FF0000]">
                Step 1/1
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Goal
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { v: "Fat Loss" as const, l: "Fat Loss" },
                      { v: "Muscle Gain" as const, l: "Muscle Gain" },
                      { v: "Healthy Lifestyle" as const, l: "Healthy Lifestyle" },
                    ] as const
                  ).map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={goal === v}
                      onClick={() => setGoal(v)}
                      className={[
                        "min-h-[40px] flex-1 min-w-[6rem] rounded-xl border px-3 py-2 text-sm font-semibold transition",
                        goal === v
                          ? "border-[#FF0000]/50 bg-[#FF0000]/10 text-[#950101] dark:border-[#FF0000]/40 dark:bg-[#FF0000]/10 dark:text-[#FF0000]"
                          : "border-zinc-200 bg-white text-zinc-950 hover:border-[#FF0000]/40 dark:border-white/10 dark:bg-black dark:text-zinc-50",
                      ].join(" ")}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Budget (days)
                </span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-[#FF0000] focus:ring-2 focus:ring-[#FF0000]/20 dark:border-white/10 dark:bg-black dark:text-zinc-50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Age</span>
                <input
                  type="number"
                  min={13}
                  max={80}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-[#FF0000] focus:ring-2 focus:ring-[#FF0000]/20 dark:border-white/10 dark:bg-black dark:text-zinc-50"
                />
              </label>

              <div className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Activity
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { v: "Low" as const, l: "Low" },
                      { v: "Moderate" as const, l: "Moderate" },
                      { v: "High" as const, l: "High" },
                    ] as const
                  ).map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={activity === v}
                      onClick={() => setActivity(v)}
                      className={[
                        "min-h-[40px] flex-1 min-w-[5rem] rounded-xl border px-3 py-2 text-sm font-semibold transition",
                        activity === v
                          ? "border-[#FF0000]/50 bg-[#FF0000]/10 text-[#950101] dark:border-[#FF0000]/40 dark:bg-[#FF0000]/10 dark:text-[#FF0000]"
                          : "border-zinc-200 bg-white text-zinc-950 hover:border-[#FF0000]/40 dark:border-white/10 dark:bg-black dark:text-zinc-50",
                      ].join(" ")}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Height (cm)
                </span>
                <input
                  type="number"
                  min={120}
                  max={220}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-[#FF0000] focus:ring-2 focus:ring-[#FF0000]/20 dark:border-white/10 dark:bg-black dark:text-zinc-50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Weight (kg)
                </span>
                <input
                  type="number"
                  min={35}
                  max={220}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-[#FF0000] focus:ring-2 focus:ring-[#FF0000]/20 dark:border-white/10 dark:bg-black dark:text-zinc-50"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.99 }}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF0000] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#950101] focus:outline-none focus:ring-2 focus:ring-[#FF0000]/30 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none sm:w-40 dark:bg-[#950101] dark:hover:bg-[#FF0000]"
                disabled={status === "generating"}
              >
                {status === "generating" ? "Analyzing..." : "Generate plan"}
              </motion.button>
              <div className="text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                You can download the plan as a PDF after phase 2 connects the AI.
              </div>
            </div>

            {status !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-6 rounded-2xl border border-[#FF0000]/20 bg-[#FF0000]/10 p-4 dark:bg-[#950101]/10"
              >
                <p className="text-sm font-semibold text-[#950101] dark:text-[#FF0000]">
                  {status === "generating"
                    ? "Groceries + nutrition breakdown in progress..."
                    : "Preview ready"}
                </p>
                <p className="mt-1 text-xs text-[#950101]/70 dark:text-[#FF0000]/70">
                  Goal: {goal} • Budget: {budget} days • Activity: {activity}
                </p>
              </motion.div>
            )}
          </form>

          <motion.div
            className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30 lg:p-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Estimated nutrition
              </h3>
                <div className="rounded-full border border-[#FF0000]/20 bg-[#FF0000]/10 px-3 py-1 text-xs font-semibold text-[#950101] dark:bg-[#950101]/10 dark:text-[#FF0000]">
                AI-ready
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-white/10 dark:bg-black/40">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Calories</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {preview.calories}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">kcal/day</p>
              </div>

              <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-white/10 dark:bg-black/40">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Protein</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {preview.proteinG}g
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">per day</p>
              </div>

              <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-white/10 dark:bg-black/40">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Carbs</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {preview.carbsG}g
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">per day</p>
              </div>

              <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-white/10 dark:bg-black/40">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Fat</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {preview.fatG}g
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">per day</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-white/10 dark:bg-black/40">
              <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Next: Meal plan + Grocery list
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                In phase 2, your nutrition breakdown will power a full 7-day plan with
                Tamil + Indian-friendly meal options and a grocery list tailored to your budget.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

