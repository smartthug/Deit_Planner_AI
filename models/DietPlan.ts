import mongoose from "mongoose";
import type { DietPlanInput } from "@/lib/validation/groqDietPlan";
import type { GroqDietPlanOutput } from "@/lib/validation/groqDietPlan";

export type DietPlanDocument = mongoose.HydratedDocument<DietPlan>;

export type DietPlan = {
  userId: mongoose.Types.ObjectId;
  input: DietPlanInput;
  output: GroqDietPlanOutput;
  createdAt: Date;
};

const MealSchema = new mongoose.Schema(
  {
    breakfast: { type: [String], default: [] },
    lunch: { type: [String], default: [] },
    dinner: { type: [String], default: [] },
  },
  { _id: false },
);

const OutputSchema = new mongoose.Schema(
  {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: false },
    dailyRoutine: { type: String, default: "" },
    meals: { type: MealSchema, required: true },
    grocery: { type: [String], default: [] },
    fruits: { type: [String], default: [] },
  },
  { _id: false },
);

const DietPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    input: {
      age: { type: Number, required: true },
      weightKg: { type: Number, required: true },
      heightCm: { type: Number, required: true },
      goal: { type: String, required: true },
      budget: { type: String, required: true },
      diet: { type: String, required: true },
      cuisine: { type: String, required: true },
    },
    output: { type: OutputSchema, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
);

DietPlanSchema.index({ userId: 1, createdAt: -1 });

export const DietPlan =
  ((mongoose.models.DietPlan as mongoose.Model<DietPlanDocument>) ??
    mongoose.model<DietPlanDocument>("DietPlan", DietPlanSchema)) as
    | mongoose.Model<DietPlanDocument>;

