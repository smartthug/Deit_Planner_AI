import {
  GroqDailyRoutineOnlySchema,
  GroqDietPlanCoreSchema,
  GroqDietPlanOutputSchema,
  type DietPlanInput,
} from "@/lib/validation/groqDietPlan";
import type { GroqDietPlanOutput } from "@/lib/validation/groqDietPlan";

const FALLBACK_MODEL = "llama-3.1-8b-instant";

function getGroqApiKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing required env var: GROQ_API_KEY");
  return key;
}

function getGroqModel() {
  const configured = process.env.GROQ_MODEL?.trim();
  if (!configured) return FALLBACK_MODEL;

  if (configured === "llama3-70b-8192" || configured === "llama3-8b-8192") {
    return FALLBACK_MODEL;
  }

  return configured;
}

function parsePositiveIntEnv(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/** Compact JSON (macros + meals + lists) — keep completion budget moderate. */
function getCoreMaxTokens(): number {
  return parsePositiveIntEnv("GROQ_MAX_TOKENS_CORE", 2400, 800, 4096);
}

/** Long `dailyRoutine` string needs its own completion budget (separate request). */
function getRoutineMaxTokens(): number {
  return parsePositiveIntEnv("GROQ_MAX_TOKENS_ROUTINE", 4500, 1200, 6000);
}

/** Pause between core + routine calls so both don’t hit the same TPM window (on_demand ~6000/min). */
function getPhaseDelayMs(): number {
  return parsePositiveIntEnv("GROQ_PHASE_DELAY_MS", 2800, 0, 120_000);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Groq returns e.g. "try again in 1.859999999s" in the JSON message. */
function parseGroqRetryAfterMs(body: string): number | null {
  const m = body.match(/try again in ([\d.]+)\s*s/i);
  if (!m) return null;
  const sec = Number(m[1]);
  if (!Number.isFinite(sec) || sec < 0) return null;
  return Math.min(65_000, Math.ceil(sec * 1000) + 500);
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();

  const candidates: string[] = [trimmed];
  candidates.push(trimmed.replace(/^```json\s*/i, "").replace(/```$/i, "").trim());

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }

    const repaired = candidate
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
    try {
      return JSON.parse(repaired);
    } catch {
      // continue
    }
  }

  throw new Error("Groq response was not valid JSON");
}

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

function isTokenLimitError(status: number, text: string) {
  return (
    status === 413 ||
    (text.includes("rate_limit_exceeded") && text.includes("TPM")) ||
    text.includes("Request too large")
  );
}

function isJsonValidateFailed(text: string) {
  return text.includes("json_validate_failed") || text.includes("max completion tokens reached");
}

async function groqChat(
  model: string,
  userPrompt: string,
  maxTokens: number,
  jsonObject: boolean,
): Promise<{ ok: true; content: string } | { ok: false; status: number; body: string }> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGroqApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      ...(jsonObject ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    return { ok: false, status: res.status, body };
  }

  let json: GroqChatCompletionResponse;
  try {
    json = JSON.parse(body) as GroqChatCompletionResponse;
  } catch {
    return { ok: false, status: 502, body: "Invalid JSON from Groq" };
  }

  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return { ok: false, status: 502, body: "Groq response missing message content" };
  }

  return { ok: true, content };
}

async function runGroqWithFallbacks(
  primaryModel: string,
  userPrompt: string,
  maxTokens: number,
  jsonObject: boolean,
): Promise<string> {
  let model = primaryModel;
  let tokens = maxTokens;

  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const r = await groqChat(model, userPrompt, tokens, jsonObject);
    if (r.ok) return r.content;

    const body = r.body;

    if (r.status === 429 && body.includes("rate_limit")) {
      const waitMs = parseGroqRetryAfterMs(body) ?? 3200 + attempt * 800;
      await sleep(waitMs);
      continue;
    }

    const isDecommissioned =
      r.status === 400 &&
      (body.includes("model_decommissioned") || body.includes("decommissioned"));

    if (isDecommissioned && model !== FALLBACK_MODEL) {
      model = FALLBACK_MODEL;
      continue;
    }

    if (isTokenLimitError(r.status, body) && tokens > 1200) {
      tokens = Math.max(1200, Math.floor(tokens * 0.65));
      continue;
    }

    if (r.status === 400 && isJsonValidateFailed(body) && tokens < 5800) {
      tokens = Math.min(5800, Math.floor(tokens * 1.35) + 400);
      continue;
    }

    throw new Error(`Groq request failed: ${r.status} ${body}`);
  }

  throw new Error(
    "Groq rate limit: too many retries. Wait one minute and try Regenerate again, or upgrade your Groq tier.",
  );
}

function cuisineStyleForPrompt(cuisine: DietPlanInput["cuisine"]): string {
  if (cuisine === "Tamil") return "North Indian";
  if (cuisine === "Indian") return "South Indian";
  return "Mixed";
}

/** High-priority clinical-style rules; still output app JSON, not plain “Day 1:” blocks. */
function buildNutritionistRules(input: DietPlanInput): string {
  const proteinSources =
    input.diet === "Vegan"
      ? "Plant proteins: dal, rajma, chana, soya chunks, tofu, peanuts, nuts, seeds; no dairy or eggs."
      : input.diet === "Veg"
        ? "Proteins: dal varieties, paneer in moderation, milk/curd, soya chunks, peanuts, legumes, chana, rajma."
        : "Proteins: eggs, chicken, fish, lean meats, plus dal, soya, peanuts as fits budget.";

  const weightLossBlock = [
    "WEIGHT LOSS (fat loss, lean body) — apply ALL:",
    "1) Calorie deficit: JSON calories + meals must reflect a sustainable fat-loss intake for this weight/height (often ~1600–2000 kcal/day for many adults; adjust sensibly for age/size).",
    "2) Ban or avoid recommending: biryani, fried snacks, vada, pakora, heavy cream curries, sugary drinks, junk/fast food.",
    "3) Rice: small portions only; rice at most 1–2 times/day, not both lunch and dinner as full plates.",
    "4) Dinner must be LIGHT: prefer roti/sabzi, soup+dal, salad+protein — avoid heavy carbs (no big rice dinner).",
    `5) High protein within diet rules: ${proteinSources}`,
    "6) Budget Low: staple, affordable Indian home foods; seasonal vegetables; limit costly ingredients.",
    "7) Never make lunch and dinner the same heavy dish on any day.",
    "8) Each calendar day must have distinct Breakfast, Lunch, Dinner in the three meal arrays (same index = same day).",
    "9) Realistic Indian home cooking; oils in moderation.",
    "10) Strong variety across the 7 days (rotate grains, dal, vegetables, protein source).",
    `11) Protein target in JSON: aim ~${Math.round(Math.min(120, Math.max(55, input.weightKg * 0.9)))}–${Math.round(Math.min(130, Math.max(60, input.weightKg * 1.1)))}g/day where compatible with diet + deficit.`,
    "12) EVERY meal line must include exact quantities (examples: 2 eggs, 1 roti, 1 cup cooked rice (150g), 100g chicken, 1 cup dal (200ml)); no vague items without quantity.",
  ].join("\n");

  const muscleBlock = [
    "MUSCLE GAIN: slight calorie surplus vs maintenance; prioritize protein each meal; pre/post workout slots in dailyRoutine; still avoid deep-fried junk; vary meals across 7 days.",
    proteinSources,
    "Every meal option must include exact quantities (units like g, cups, number of pieces, ml).",
  ].join("\n");

  const maintainBlock = [
    "MAINTAIN: roughly energy-balanced day; varied meals; limit fried/junk; rice in moderation; dinner lighter than lunch when possible.",
    proteinSources,
    "Every meal option must include exact quantities (units like g, cups, number of pieces, ml).",
  ].join("\n");

  const goalBlock =
    input.goal === "Weight Loss"
      ? weightLossBlock
      : input.goal === "Muscle Gain"
        ? muscleBlock
        : maintainBlock;

  return [
    "You are a certified fitness nutritionist. Plans must be safe, practical, and culturally appropriate.",
    goalBlock,
    `Budget ${input.budget}: if Low, stress economical ingredients and simple prep.`,
    `Food style ${cuisineStyleForPrompt(input.cuisine)}; respect diet type ${input.diet} strictly.`,
  ].join("\n\n");
}

export async function generateGroqDietPlan(input: DietPlanInput): Promise<GroqDietPlanOutput> {
  const dietRules =
    input.diet === "Veg"
      ? "No meat, fish, or eggs; use paneer, legumes, dairy, soya, nuts."
      : input.diet === "Vegan"
        ? "Vegan: no meat, fish, eggs, dairy, or honey; plant-based proteins, legumes, nuts, seeds, plant milks."
        : "Meat, fish, eggs, dairy allowed as appropriate.";

  const style = cuisineStyleForPrompt(input.cuisine);
  const userLine = `User: age ${input.age}, ${input.weightKg}kg, ${input.heightCm}cm, goal ${input.goal}, budget ${input.budget}, diet ${input.diet} (${dietRules}), food style ${style}.`;

  const nutritionistRules = buildNutritionistRules(input);

  const primaryModel = getGroqModel();

  const promptCore = [
    "Indian nutrition planner. Return ONE JSON object (json_object mode). No markdown.",
    userLine,
    "",
    nutritionistRules,
    "",
    "Include ONLY these keys: calories, protein, carbs, fats, meals, grocery, fruits.",
    "calories, protein, carbs, fats MUST be JSON numbers (e.g. 2100, 120, 280, 70) — not strings.",
    "meals.breakfast[i], meals.lunch[i], meals.dinner[i] = Day i+1 only (7 days). One concise line per slot describing that meal; obey ALL rules above.",
    "Each meal string MUST contain exact quantity and unit for all key items (e.g., \"2 eggs + 2 rotis (60g flour total) + 1 cup vegetable sabzi (150g)\").",
    "grocery: weekly list; every item string must include ₹ and quantity.",
    "fruits: array of short strings (fruit + note).",
    "JSON numbers must match the meal plan you described (totals coherent with goal).",
  ].join("\n");

  const coreContent = await runGroqWithFallbacks(
    primaryModel,
    promptCore,
    getCoreMaxTokens(),
    true,
  );
  const coreParsed = GroqDietPlanCoreSchema.safeParse(extractJsonObject(coreContent));
  if (!coreParsed.success) {
    throw new Error(`Groq core output invalid: ${coreParsed.error.message}`);
  }
  const core = coreParsed.data;

  await sleep(getPhaseDelayMs());

  const macroLine = `Match these totals in the 📊 section: calories ${core.calories}, protein ${core.protein}g, carbs ${core.carbs}g, fats ${core.fats ?? "omit or estimate"}g.`;

  const routineMealSlots =
    input.goal === "Muscle Gain"
      ? "Early morning, Breakfast, Lunch, Pre-workout, Post-workout, Dinner, Before sleep."
      : input.goal === "Weight Loss"
        ? "Early morning (optional), Breakfast, Lunch, Dinner, Before sleep — dinner options must stay LIGHT (no heavy rice); rice-heavy choices only at breakfast or lunch if at all."
        : "Early morning (optional), Breakfast, Lunch, Dinner, Before sleep.";

  const promptRoutine = [
    "Indian nutrition planner. Return ONE JSON object with ONLY key: dailyRoutine (json_object mode). No markdown.",
    userLine,
    macroLine,
    "",
    nutritionistRules,
    "",
    'dailyRoutine is ONE JSON string using \\n between lines.',
    "Line 1 exactly: 🍽️ MEAL STRUCTURE (MULTI OPTIONS)",
    `Then slots: ${routineMealSlots}`,
    "Each slot: emoji+TITLE (time), blank line, Choose ONE:, 3–4 short option lines with exact quantities/units, blank line, 👉 Calories/Protein as needed.",
    "End: 📊 DAILY TOTAL (AVERAGE) then lines 🔥 💪 🍚 🥑 aligned with the macro line above.",
    "After totals, add section title exactly: STRICTLY AVOID: then bullet lines including: Junk food, Fried food (vada, chips), Sugary drinks, Bakery items, Overeating.",
    'Then add section title exactly: EXPECTED RESULT: and one line in this template: "If followed strictly, user will lose X kg in Y weeks." Use realistic X and Y based on calorie deficit.',
    "Options must obey the same nutritionist rules (no biryani/fried/junk; budget; diet type; variety).",
  ].join("\n");

  const routineContent = await runGroqWithFallbacks(
    primaryModel,
    promptRoutine,
    getRoutineMaxTokens(),
    true,
  );
  const routineParsed = GroqDailyRoutineOnlySchema.safeParse(extractJsonObject(routineContent));
  if (!routineParsed.success) {
    throw new Error(`Groq dailyRoutine invalid: ${routineParsed.error.message}`);
  }

  const merged = {
    ...core,
    dailyRoutine: routineParsed.data.dailyRoutine,
  };

  const finalParsed = GroqDietPlanOutputSchema.safeParse(merged);
  if (!finalParsed.success) {
    throw new Error(`Merged plan invalid: ${finalParsed.error.message}`);
  }

  return finalParsed.data;
}
