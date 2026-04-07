"use client";

import { useEffect, useMemo, useState } from "react";
import type { DietPlanInput } from "@/lib/validation/groqDietPlan";
import type { GroqDietPlanOutput } from "@/lib/validation/groqDietPlan";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import type { OnboardingOutputs } from "@/models/User";

type PlanSummary = {
  id: string;
  input: DietPlanInput;
  output: GroqDietPlanOutput;
  createdAt: string;
};

export type PlanProfileSummary = {
  displayName: string;
  bmi: string;
  goal: string;
  activity: string;
};

type TabKey = "daily" | "weekly" | "grocery";

type PricingFeature = {
  key: OnboardingOutputs;
  title: string;
  amount: number;
};

const PRICING_FEATURES: PricingFeature[] = [
  { key: "Daily Plan", title: "Daily", amount: 99 },
  { key: "Weekly Plan", title: "Weekly", amount: 99 },
  { key: "Grocery List", title: "Grocery", amount: 49 },
  { key: "Calories Breakdown", title: "Calories Breakdown", amount: 49 },
];
const STRIKE_ADDON = 300;
const PAYMENT_WINDOW_SECONDS = 3 * 60 + 30;
const EXTEND_SECONDS = 30;
const MAX_EXTENDS = 2;
const EXTEND_PRICE = 59;

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function computeOfferTotals(selected: OnboardingOutputs[]): { original: number; offer: number } {
  const picked = PRICING_FEATURES.filter((f) => selected.includes(f.key));
  const total = picked.reduce((s, f) => s + f.amount, 0);
  return {
    original: total + STRIKE_ADDON,
    offer: total,
  };
}

function IconCheckCircleFilled({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path
        d="M6 10l2.5 2.5L14 7"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheckCircleOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 10l2.5 2.5L14 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCircleOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconWarning({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 9v4m0 4h.01M10.3 3.9L2.7 19.1c-.4.8.2 1.9 1.1 1.9h16.4c.9 0 1.5-1.1 1.1-1.9L13.7 3.9c-.4-.8-1.6-.8-2 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionPickIcon({ selected }: { selected: boolean }) {
  if (selected) {
    return <IconCheckCircleFilled className="h-5 w-5 shrink-0 text-[#FF0000]" />;
  }
  return <IconCircleOutline className="h-5 w-5 shrink-0 text-zinc-300" />;
}

export default function PlanClient({
  initialInput,
  initialPlan,
  initialSelections,
  planProfile,
}: {
  initialInput: DietPlanInput;
  initialPlan: PlanSummary | null;
  initialSelections: OnboardingOutputs[];
  planProfile: PlanProfileSummary;
}) {
  const [plan, setPlan] = useState<PlanSummary | null>(initialPlan);
  const [activeTab, setActiveTab] = useState<TabKey>("daily");
  const [budget, setBudget] = useState(initialInput.budget);

  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "error">(
    initialPlan ? "ready" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const [selectedFeatures, setSelectedFeatures] = useState<OnboardingOutputs[]>(initialSelections ?? []);
  const [purchasedFeatures, setPurchasedFeatures] = useState<OnboardingOutputs[]>([]);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [unlockSecondsLeft, setUnlockSecondsLeft] = useState(PAYMENT_WINDOW_SECONDS);
  const [unlockTimerRunning, setUnlockTimerRunning] = useState(false);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [extendsLeft, setExtendsLeft] = useState(MAX_EXTENDS);

  const ui = {
    changeBudget: "Budget",
    regenerate: "Generate plan",
    pdf: "Download PDF",
    daily: "Daily",
    weekly: "Weekly",
    grocery: "Grocery",
  } as const;

  async function generatePlan(nextBudget: DietPlanInput["budget"]) {
    setError(null);
    setStatus("generating");
    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...initialInput,
          budget: nextBudget,
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { ok: true; plan: PlanSummary }
        | { error: string }
        | null;

      if (!res.ok) {
        setStatus("error");
        setError(payload && "error" in payload ? payload.error : "Generation failed");
        return;
      }

      if (!payload || !("ok" in payload)) {
        setStatus("error");
        setError("Generation failed");
        return;
      }

      const planObj = payload.plan;
      setPlan(planObj);
      setActiveTab("daily");
      setStatus("ready");
      setPurchasedFeatures([]);
      setUnlockTimerRunning(false);
      setPaymentExpired(false);
      setUnlockSecondsLeft(PAYMENT_WINDOW_SECONDS);
      setExtendsLeft(MAX_EXTENDS);
      setIsPaymentOpen(false);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Generation failed");
    }
  }

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (initialPlan) return;
    void generatePlan(budget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!unlockTimerRunning) return;
    if (unlockSecondsLeft <= 0) {
      setUnlockTimerRunning(false);
      setIsPaymentOpen(false);
      setPaymentExpired(true);
      setSelectedFeatures([]);
      setPurchasedFeatures([]);
      setActiveTab("daily");
      return;
    }
    const id = window.setTimeout(() => {
      setUnlockSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [unlockTimerRunning, unlockSecondsLeft]);

  const output = plan?.output;

  const nutrition = useMemo(() => {
    return {
      calories: output?.calories,
      protein: output?.protein,
      carbs: output?.carbs,
      fats: output?.fats,
    };
  }, [output]);

  const purchasedSet = useMemo(() => new Set(purchasedFeatures), [purchasedFeatures]);
  const selectedSet = useMemo(() => new Set(selectedFeatures), [selectedFeatures]);
  const selectedCount = selectedFeatures.length;

  const priceQuote = useMemo(() => computeOfferTotals(selectedFeatures), [selectedFeatures]);
  const extensionCount = MAX_EXTENDS - extendsLeft;
  const payableTotal = priceQuote.offer + extensionCount * EXTEND_PRICE;

  function toggleFeature(k: OnboardingOutputs) {
    if (paymentExpired || unlockTimerRunning) return;
    setSelectedFeatures((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  }

  function isUnlocked(feature: OnboardingOutputs): boolean {
    return purchasedSet.has(feature);
  }

  const activeFeatureForTab: Record<TabKey, OnboardingOutputs> = {
    daily: "Daily Plan",
    weekly: "Weekly Plan",
    grocery: "Grocery List",
  };

  const hasPurchased = purchasedFeatures.length > 0;

  function openPaymentPopup() {
    if (paymentExpired) return;
    if (selectedCount === 0) {
      setSelectedFeatures(PRICING_FEATURES.map((f) => f.key));
    }
    if (!unlockTimerRunning) {
      setUnlockSecondsLeft(PAYMENT_WINDOW_SECONDS);
      setUnlockTimerRunning(true);
      setExtendsLeft(MAX_EXTENDS);
    }
    setPaymentExpired(false);
    setIsPaymentOpen(true);
  }

  function startAgain() {
    setIsPaymentOpen(false);
    setUnlockTimerRunning(false);
    setPaymentExpired(false);
    setUnlockSecondsLeft(PAYMENT_WINDOW_SECONDS);
    setSelectedFeatures([]);
    setPurchasedFeatures([]);
    setExtendsLeft(MAX_EXTENDS);
    setActiveTab("daily");
  }

  function completePayAndUnlock() {
    if (selectedCount === 0) return;
    setPurchasedFeatures([...selectedFeatures]);
    setUnlockTimerRunning(false);
    setIsPaymentOpen(false);
  }

  function extendTimer() {
    if (extendsLeft <= 0) return;
    setUnlockSecondsLeft((s) => s + EXTEND_SECONDS);
    setExtendsLeft((n) => n - 1);
  }

  const showHeaderTimer = unlockTimerRunning && unlockSecondsLeft > 0 && !hasPurchased;
  const planReady = Boolean(plan && output && status !== "generating");

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {planReady && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-[#950101]">
                  <IconCheckCircleFilled className="h-4 w-4 shrink-0 text-[#FF0000]" />
                  Your plan is ready
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Your AI Diet Plan
                </h1>
              </div>
              {showHeaderTimer && (
                <div className="inline-flex w-fit items-center rounded-full border border-[#FF0000]/25 bg-[#FF0000]/10 px-4 py-2 text-sm font-semibold text-[#950101]">
                  Unlock timer: {formatCountdown(unlockSecondsLeft)}
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ProfileStat label="Name" value={planProfile.displayName} />
              <ProfileStat label="BMI" value={planProfile.bmi} />
              <ProfileStat label="Goal" value={planProfile.goal} />
              <ProfileStat label="Activity" value={planProfile.activity} />
            </div>
          </motion.section>
        )}

        {!planReady && (
          <div className="rounded-[1.75rem] border border-zinc-200/80 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#950101]">Preparing your plan</p>
            <h1 className="mt-2 text-2xl font-bold text-zinc-900">Your AI Diet Plan</h1>
            <p className="mt-2 text-sm text-zinc-500">
              {status === "generating"
                ? "Generating your personalized meals and macros…"
                : "We’ll build your plan as soon as you continue."}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-[1.75rem] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {ui.changeBudget}
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value as DietPlanInput["budget"])}
                disabled={unlockTimerRunning}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium outline-none transition focus:border-[#FF0000]/40 focus:ring-2 focus:ring-[#FF0000]/15 disabled:opacity-50"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={status === "generating" || unlockTimerRunning}
                onClick={() => void generatePlan(budget)}
                className="rounded-xl bg-[#FF0000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#950101] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "generating" ? "Generating…" : ui.regenerate}
              </button>
              {plan && hasPurchased && (
                <button
                  type="button"
                  disabled={status === "generating"}
                  onClick={async () => {
                    setError(null);
                    try {
                      const res = await fetch(`/api/plan/pdf?planId=${plan.id}`, {
                        method: "GET",
                        credentials: "include",
                      });
                      if (!res.ok) {
                        const payload = (await res.json().catch(() => null)) as
                          | { error?: string }
                          | null;
                        setError(payload?.error ?? "PDF download failed");
                        return;
                      }
                      const blob = await res.blob();
                      if (!blob || blob.size === 0) {
                        setError("PDF download failed: empty file");
                        return;
                      }
                      const href = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = href;
                      a.download = `diet-plan-${plan.id.slice(-6)}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      setTimeout(() => URL.revokeObjectURL(href), 1000);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "PDF download failed");
                    }
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-[#FF0000]/40 hover:text-[#950101]"
                >
                  {ui.pdf}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {error}
            </div>
          )}

          {planReady && (
            <>
              <div className="mt-6 border-t border-zinc-100 pt-6">
                <h3 className="text-sm font-semibold text-zinc-900">Payment required</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Click Proceed to payment, complete your selection, and finish before timer ends.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openPaymentPopup}
                    disabled={paymentExpired || hasPurchased}
                    className="rounded-xl bg-[#FF0000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#950101] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Proceed to payment
                  </button>
                  {unlockTimerRunning && !isPaymentOpen && !paymentExpired && (
                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(true)}
                      className="rounded-xl border border-[#FF0000]/30 bg-[#FF0000]/10 px-4 py-2.5 text-sm font-semibold text-[#950101] transition hover:bg-[#FF0000]/15"
                    >
                      Resume checkout
                    </button>
                  )}
                  {paymentExpired && (
                    <button
                      type="button"
                      onClick={startAgain}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                    >
                      Start again
                    </button>
                  )}
                </div>
                {paymentExpired && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    Time ran out. Start again to pick sections and unlock your plan.
                  </p>
                )}
                {hasPurchased && (
                  <p className="mt-3 text-xs font-medium text-[#950101]">
                    Sections unlocked successfully.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {planReady && hasPurchased && (
            <motion.div
              key="plan-body"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-6"
            >
              <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-sm">
                <div
                  className={[
                    "p-5 sm:p-6 transition-[filter,opacity]",
                    hasPurchased ? "" : "pointer-events-none select-none blur-md opacity-60",
                  ].join(" ")}
                >
                  <h2 className="text-lg font-bold text-[#950101]">7‑Day Diet Plan</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Meals, grocery ideas, and macro targets tailored to your profile.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoCard label="Calories" value={`${nutrition.calories ?? "—"} kcal`} locked={!isUnlocked("Calories Breakdown")} />
                    <InfoCard label="Protein" value={`${nutrition.protein ?? "—"} g`} locked={!isUnlocked("Calories Breakdown")} />
                    <InfoCard label="Carbs" value={`${nutrition.carbs ?? "—"} g`} locked={!isUnlocked("Calories Breakdown")} />
                    <InfoCard label="Fats" value={`${typeof nutrition.fats === "number" ? nutrition.fats : "—"} g`} locked={!isUnlocked("Calories Breakdown")} />
                  </div>

                  <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                        <TabButton active={activeTab === "daily"} locked={!isUnlocked("Daily Plan")} onClick={() => setActiveTab("daily")}>
                          {ui.daily}
                        </TabButton>
                        <TabButton active={activeTab === "weekly"} locked={!isUnlocked("Weekly Plan")} onClick={() => setActiveTab("weekly")}>
                          {ui.weekly}
                        </TabButton>
                        <TabButton active={activeTab === "grocery"} locked={!isUnlocked("Grocery List")} onClick={() => setActiveTab("grocery")}>
                          {ui.grocery}
                        </TabButton>
                      </div>
                      {plan != null && plan.createdAt && isHydrated && (
                        <span className="text-xs font-medium text-zinc-400">
                          Saved {new Date(plan.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="relative mt-4 min-h-[120px]">
                      <div
                        className={
                          isUnlocked(activeFeatureForTab[activeTab]) ? "" : "pointer-events-none select-none blur-sm opacity-70"
                        }
                      >
                        <TabContent tab={activeTab} output={output!} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {status === "generating" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-8 text-center shadow-sm"
            >
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#FF0000]/20 border-t-[#FF0000]" />
              <p className="mt-4 text-sm font-semibold text-zinc-700">Generating your plan…</p>
              <p className="mt-1 text-xs text-zinc-500">This usually takes under a minute.</p>
            </motion.div>
          )}

          {!plan && status !== "generating" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-white p-6 text-sm font-medium text-zinc-600 shadow-sm"
            >
              No plan yet. Adjust budget and tap Generate plan.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isPaymentOpen && (
        <PaymentModal
          timeLeftLabel={formatCountdown(unlockSecondsLeft)}
          subtitle={`${planProfile.goal} plan`}
          originalInr={priceQuote.original}
          offerInr={payableTotal}
          extendsLeft={extendsLeft}
          onClose={() => setIsPaymentOpen(false)}
          onPayUnlock={completePayAndUnlock}
          onExtend={extendTimer}
        />
      )}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  locked,
}: {
  label: string;
  value: string;
  locked: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-zinc-100 bg-white px-3 py-3 sm:px-4",
        locked ? "opacity-80" : "",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-base font-bold text-zinc-900 sm:text-lg">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  locked,
  children,
  onClick,
}: {
  active: boolean;
  locked?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl px-4 py-2 text-sm font-semibold transition sm:w-auto",
        active
          ? "border border-[#FF0000]/40 bg-[#FF0000]/10 text-[#950101]"
          : "border border-zinc-200 bg-white text-zinc-700 hover:border-[#FF0000]/25",
        locked ? "opacity-75" : "",
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {locked ? <IconLock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden /> : null}
      </span>
    </button>
  );
}

function PaymentModal({
  timeLeftLabel,
  subtitle,
  originalInr,
  offerInr,
  extendsLeft,
  onClose,
  onPayUnlock,
  onExtend,
}: {
  timeLeftLabel: string;
  subtitle: string;
  originalInr: number;
  offerInr: number;
  extendsLeft: number;
  onClose: () => void;
  onPayUnlock: () => void;
  onExtend: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto inline-flex rounded-full border border-[#FF0000]/35 bg-[#FF0000]/10 px-4 py-1.5 text-xs font-bold tracking-wide text-[#950101]">
            LIMITED OFFER — {timeLeftLabel}
          </div>
          <h3 className="mt-5 text-2xl font-bold text-zinc-900">Unlock your full plan</h3>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-lg text-zinc-400 line-through">₹{originalInr}</p>
          <p className="mt-1 text-4xl font-bold text-[#FF0000]">₹{offerInr}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#950101]">Total amount</p>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800">
          <IconWarning className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <span>If you miss this, you must start again. Hurry up!</span>
        </div>

        <button
          type="button"
          disabled={offerInr <= 0}
          onClick={onPayUnlock}
          className="mt-6 w-full rounded-2xl bg-[#FF0000] py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#950101] disabled:opacity-50"
        >
          Pay &amp; unlock
        </button>

        <button
          type="button"
          disabled={extendsLeft <= 0}
          onClick={onExtend}
          className="mt-3 w-full rounded-2xl border border-zinc-200 bg-zinc-100 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add 30 seconds for ₹{EXTEND_PRICE} ({extendsLeft} left)
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function TabContent({
  tab,
  output,
}: {
  tab: TabKey;
  output: GroqDietPlanOutput;
}) {
  if (tab === "grocery") {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Grocery (weekly)</div>
          <div className="mt-3 space-y-2">
            {output.grocery.map((g, idx) => (
              <div key={idx} className="text-sm text-zinc-600">
                • {g}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-zinc-900">Fruits</div>
          <div className="mt-3 space-y-2">
            {output.fruits.map((f, idx) => (
              <div key={idx} className="text-sm text-zinc-600">
                • {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const meals = output.meals;
  if (tab === "daily") {
    const routine = output.dailyRoutine?.trim();
    if (routine) {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-zinc-900">Daily diet routine</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Pick one option per slot. Times and totals are estimates—adjust to your schedule.
            </p>
            <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-700">
              {routine}
            </pre>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <DayCard day={1} breakfast={meals.breakfast[0]} lunch={meals.lunch[0]} dinner={meals.dinner[0]} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: 7 }).map((_, idx) => {
        const i = idx as number;
        return (
          <DayCard
            key={idx}
            day={idx + 1}
            breakfast={meals.breakfast[i]}
            lunch={meals.lunch[i]}
            dinner={meals.dinner[i]}
          />
        );
      })}
    </div>
  );
}

function DayCard({
  day,
  breakfast,
  lunch,
  dinner,
}: {
  day: number;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4">
      <div className="text-sm font-semibold text-zinc-900">Day {day}</div>
      <div className="mt-2 space-y-1 text-sm text-zinc-600">
        <div>Breakfast: {breakfast ?? "—"}</div>
        <div>Lunch: {lunch ?? "—"}</div>
        <div>Dinner: {dinner ?? "—"}</div>
      </div>
    </div>
  );
}
