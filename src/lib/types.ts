export type BodyComposition = {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number;
  bmi: number | null;
  body_fat_percent: number | null;
  skeletal_muscle_percent: number | null;
  muscle_mass_kg: number | null;
  protein_percent: number | null;
  basal_metabolism_kcal: number | null;
  lean_body_mass_kg: number | null;
  subcutaneous_fat_percent: number | null;
  visceral_fat_level: number | null;
  body_water_percent: number | null;
  bone_mass_kg: number | null;
  body_type_label: string | null;
  body_age: number | null;
  source: "ai_scan" | "manual";
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  start_date: string;
  start_weight_kg: number;
  target_weight_kg: number;
  target_body_fat_percent: number | null;
  target_date: string | null;
  is_active: boolean;
  updated_at: string;
};

export type Meal = {
  id: string;
  user_id: string;
  eaten_at: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  input_text: string | null;
  estimated_calories_kcal: number | null;
  estimated_protein_g: number | null;
  estimated_fat_g: number | null;
  estimated_carbs_g: number | null;
  estimated_fiber_g: number | null;
  is_ai_estimated: boolean;
  user_adjusted: boolean;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  display_name: string;
  menstrual_tracking_enabled: boolean;
};

export type Exercise = {
  id: string;
  user_id: string;
  performed_at: string;
  exercise_type: string;
  duration_minutes: number;
  estimated_calories_kcal: number | null;
  memo: string | null;
  updated_at: string;
};

export type DailySteps = {
  id: string;
  user_id: string;
  log_date: string;
  steps: number;
  updated_at: string;
};

export type WaterIntake = {
  id: string;
  user_id: string;
  logged_at: string;
  volume_ml: number;
  updated_at: string;
};

export type MenstrualCycle = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  memo: string | null;
  updated_at: string;
};
