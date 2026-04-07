"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export default function HeroScene() {
  const sources = useMemo(
    () => ["/diet.jpg", "/diet.jpeg", "/diet.webp", "/diet.png"],
    [],
  );
  const [imageIndex, setImageIndex] = useState(0);
  const src = sources[imageIndex];
  const exhausted = imageIndex >= sources.length;

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fff7f7] via-white to-[#f8fafc] text-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,0,0,0.08),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(249,115,22,0.08),transparent_42%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="max-w-xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF0000]/20 bg-[#FF0000]/10 px-3 py-1 text-xs font-semibold text-[#950101]">
            AI Fitness + Nutrition
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Transform Your Body with Smart Nutrition
          </h1>
          <p className="mt-4 text-base text-zinc-600 sm:text-lg">
            AI-powered diet and fitness plans tailored for you
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/get-started"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#FF0000] px-6 text-sm font-semibold text-white shadow-[0_0_0_0_rgba(255,0,0,0.45)] transition hover:bg-[#950101] hover:shadow-[0_0_20px_2px_rgba(255,0,0,0.25)]"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/plan"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:border-[#FF0000]/40 hover:text-[#950101] hover:shadow-[0_0_20px_2px_rgba(255,0,0,0.12)]"
              >
                View Plans
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut", delay: 0.1 }}
          className="relative h-[360px] w-full overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur sm:h-[460px] lg:h-[520px]"
        >
          {!exhausted ? (
            <Image
              src={src}
              alt="Diet meal preview"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              onError={() => setImageIndex((i) => i + 1)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-center text-sm text-zinc-600">
              Add an image named `diet` to `public`<br />
              (e.g. `diet.png` or `diet.jpg`)
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

