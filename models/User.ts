import mongoose from "mongoose";

export type GenderOption = "Male" | "Female" | "Other";
export type GoalOption = "Weight Loss" | "Muscle Gain" | "Maintain";
export type ActivityLevelOption = "No exercise" | "1-3" | "3-5" | "Daily";
export type FoodPreferenceOption = "Veg" | "Non-veg" | "Vegan";
export type CuisineOption = "Tamil" | "Indian" | "Mixed";
export type BudgetOption = "Low" | "Medium" | "High";

export type OnboardingOutputs =
  | "Daily Plan"
  | "Weekly Plan"
  | "Grocery List"
  | "Calories Breakdown";

export type OnboardingStepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type OnboardingData = {
  updatedAt: Date;
  currentStep: OnboardingStepIndex;

  // Step 1
  age?: number;
  gender?: GenderOption;
  heightCm?: number;
  weightKg?: number;

  // Step 2
  goal?: GoalOption;

  // Step 3
  activityLevel?: ActivityLevelOption;

  // Step 4
  foodPreference?: FoodPreferenceOption;
  cuisine?: CuisineOption;

  // Step 5
  budget?: BudgetOption;

  // Step 6
  wakeTime?: string; // "HH:MM"
  sleepTime?: string; // "HH:MM"
  workoutTime?: string; // "HH:MM"

  // Step 7
  outputs?: OnboardingOutputs[];
};

export type User = {
  email: string;
  passwordHash: string;
  createdAt: Date;
  onboarding: OnboardingData;
};

export type UserDocument = mongoose.HydratedDocument<User>;

const OnboardingSchema = new mongoose.Schema<OnboardingData>(
  {
    updatedAt: { type: Date, required: true, default: () => new Date() },
    currentStep: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 6,
    },

    // Step 1
    age: { type: Number, required: false },
    gender: { type: String, required: false },
    heightCm: { type: Number, required: false },
    weightKg: { type: Number, required: false },

    // Step 2
    goal: { type: String, required: false },

    // Step 3
    activityLevel: { type: String, required: false },

    // Step 4
    foodPreference: { type: String, required: false },
    cuisine: { type: String, required: false },

    // Step 5
    budget: { type: String, required: false },

    // Step 6
    wakeTime: { type: String, required: false },
    sleepTime: { type: String, required: false },
    workoutTime: { type: String, required: false },

    // Step 7
    outputs: { type: [String], required: false, default: [] },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },

    createdAt: { type: Date, required: true, default: () => new Date() },

    onboarding: {
      type: OnboardingSchema,
      required: true,
      default: () => ({
        updatedAt: new Date(),
        currentStep: 0,
        outputs: [],
      }),
    },
  },
  { timestamps: false },
);

export const User =
  ((mongoose.models.User as mongoose.Model<UserDocument>) ??
    mongoose.model<UserDocument>("User", UserSchema));

