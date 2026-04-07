"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroScene from "@/components/landing/HeroScene";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FF0000]/20 bg-[#FF0000]/10 text-[#950101] dark:bg-[#950101]/10 dark:text-[#FF0000]">
      {children}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45 }}
      className="group rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:border-[#FF0000]/30 hover:bg-white dark:border-white/10 dark:bg-black/30"
    >
      <div className="flex items-start gap-4">
        <Icon>{icon}</Icon>
        <div>
          <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPageClient() {
  const features = [
    {
      title: "AI Meal Planning",
      description: "Personalized meals based on your goal, body details, and food preferences.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 3h6v4H9z" />
          <path d="M7 21h10" />
          <path d="M8 3h8v4H8z" opacity="0" />
          <path d="M7 7h10v14H7z" />
          <path d="M10 11h4" />
          <path d="M10 15h4" />
        </svg>
      ),
    },
    {
      title: "Budget-Based Grocery",
      description: "Smart grocery lists that match your budget and still support your nutrition targets.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2h12l2 7H4z" />
          <path d="M4 9v13h16V9" />
          <path d="M9 13h6" />
        </svg>
      ),
    },
    {
      title: "Tamil + Indian Foods",
      description: "Indian-friendly meal options with familiar flavors and Tamil-inspired ideas.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 4h10" />
          <path d="M7 4v6c0 2 2 3 5 3s5-1 5-3V4" />
          <path d="M5 20h14" />
          <path d="M9 20v-4" />
          <path d="M15 20v-4" />
        </svg>
      ),
    },
    {
      title: "PDF Export",
      description: "Download your plan and nutrition breakdown as a clean, shareable PDF.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-black dark:bg-[#000000] dark:text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 bg-gradient-to-b from-[#3D0000]/12 via-transparent to-transparent dark:from-[#3D0000]/10 dark:via-transparent dark:to-transparent" />
      <div>
        <header className="sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white/90 px-3 py-3 backdrop-blur sm:mt-4 sm:px-4 dark:border-[#FF0000]/20 dark:bg-black/95">
              <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF0000] text-white shadow-sm dark:bg-[#950101]">
                  <span className="text-sm font-bold">AI</span>
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">DietAI</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">Simple diet planning</p>
                </div>
              </div>

              <nav className="hidden items-center gap-6 md:flex">
                <a
                  href="#features"
                  className="text-sm font-medium text-zinc-700 transition hover:text-[#FF0000] dark:text-zinc-300 dark:hover:text-[#FF0000]"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm font-medium text-zinc-700 transition hover:text-[#FF0000] dark:text-zinc-300 dark:hover:text-[#FF0000]"
                >
                  How it works
                </a>
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 transition hover:border-[#FF0000]/40 hover:text-[#FF0000] sm:px-4 sm:text-sm dark:border-white/10 dark:bg-black/30 dark:text-zinc-50"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#FF0000] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#950101] sm:px-4 sm:text-sm dark:bg-[#950101] dark:hover:bg-[#FF0000]"
                >
                  Signup
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* HERO */}
          <HeroScene />

          {/* FEATURES */}
          <section id="features" className="scroll-mt-24 pb-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    Premium features for real momentum
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Everything you need to get a practical plan quickly.
                  </p>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {features.map((f) => (
                  <FeatureCard key={f.title} title={f.title} description={f.description} icon={f.icon} />
                ))}
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="scroll-mt-24 pb-6">
            <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    How it works
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    A simple flow from your details to a full weekly plan.
                  </p>
                </div>
                <a
                  href="#get-started"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:border-[#FF0000]/40 dark:border-white/10 dark:bg-black/30 dark:text-zinc-50"
                >
                  Start now
                </a>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {[
                  {
                    n: "1",
                    title: "Enter your details",
                    body: "Share your goal, body details, and budget. We prioritize what matters for consistency.",
                  },
                  {
                    n: "2",
                    title: "AI analyzes your body",
                    body: "Groq-powered nutrition reasoning estimates calories and macros to match your target.",
                  },
                  {
                    n: "3",
                    title: "Get your diet + groceries",
                      body: "Get meals, grocery list, and nutrition summary.",
                  },
                ].map((step) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.45 }}
                    className="relative rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF0000] text-white dark:bg-[#950101]">
                        <span className="text-base font-bold">{step.n}</span>
                      </div>
                      <div className="h-2 w-14 rounded-full bg-gradient-to-r from-[#FF0000]/60 to-[#FF0000]/10" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {step.body}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* PROFESSIONAL CTA */}
          <section id="get-started" className="scroll-mt-24 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    Plan your meals in minutes
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Share your details once. We’ll generate a structured 7‑day diet plan, a weekly grocery list (with prices),
                    and a nutrition summary you can download as a PDF.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/login"
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-900 transition hover:border-[#FF0000]/40 hover:text-[#950101] dark:border-white/10 dark:bg-black/30 dark:text-zinc-50 dark:hover:border-[#FF0000]/50"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#FF0000] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#950101] dark:bg-[#950101] dark:hover:bg-[#FF0000]"
                    >
                      Signup
                    </Link>
                  </div>

                  <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      {
                        title: "7-day meal plan",
                        body: "Breakfast, lunch, and dinner for each day.",
                      },
                      {
                        title: "Budget-aware grocery list",
                        body: "Weekly shopping list with ₹ estimates.",
                      },
                      {
                        title: "Clear nutrition summary",
                        body: "Calories, protein, carbs, and fats.",
                      },
                    ].map((f) => (
                      <div
                        key={f.title}
                        className="rounded-3xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30"
                      >
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                          {f.title}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                          {f.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative rounded-[2.25rem] border border-zinc-200/70 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30">
                  <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.25rem] bg-gradient-to-b from-[#FF0000]/18 to-transparent blur-2xl" />
                  <div className="rounded-[1.75rem] border border-zinc-200/60 bg-white/70 p-6 dark:border-white/10 dark:bg-black/30">
                    <p className="text-sm font-semibold text-[#950101] dark:text-[#FF0000]">
                      What you’ll do next
                    </p>
                    <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                      <li>Sign up or log in</li>
                      <li>Complete your 7-step onboarding</li>
                      <li>Generate your diet plan + PDF</li>
                    </ol>
                    <p className="mt-5 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                      Fast onboarding, simple outputs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-zinc-200/70 bg-white/50 py-10 dark:border-white/10 dark:bg-black/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF0000] text-white dark:bg-[#950101]">
                    <span className="text-sm font-bold">AI</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">DietAI</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      Personalized diet planning powered by Groq.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Generate a 7-day plan in minutes.
                  </p>
                  <Link
                    href="/signup"
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#FF0000] px-5 text-sm font-semibold leading-none text-white shadow-sm transition hover:bg-[#950101] dark:bg-[#950101] dark:hover:bg-[#FF0000]"
                  >
                    Get started
                  </Link>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  © {new Date().getFullYear()} DietAI. Built for better nutrition habits.
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-300">
                  <a href="#how-it-works" className="hover:text-[#FF0000] dark:hover:text-[#FF0000]">
                    How it works
                  </a>
                  <a href="#get-started" className="hover:text-[#FF0000] dark:hover:text-[#FF0000]">
                    Get started
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

