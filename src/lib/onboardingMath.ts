/**
 * Rough calorie starting point for onboarding — not a clinical calculation.
 *
 * Uses a sex-averaged Mifflin-St Jeor BMR at a neutral age of 30,
 * sedentary-ish activity (1.35), then a moderate 400 kcal deficit.
 * Sustained intake below ~1200 kcal generally warrants medical supervision,
 * so the app never suggests a value below that floor.
 */
export function suggestDailyKcal(
  weightKg: number,
  heightCm: number | null,
): number {
  if (heightCm == null) {
    return 1600;
  }

  // BMR (female-neutral): 10×w + 6.25×h − 5×30 − 78
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 - 78;
  const maintenance = bmr * 1.35;
  const raw = Math.round((maintenance - 400) / 50) * 50;
  return Math.max(1200, raw);
}

/** Silent BMI for the goal-weight healthy-range guardrail only. Never display. */
export function goalBelowHealthyBmi(
  goalWeightKg: number,
  heightCm: number,
): boolean {
  const heightM = heightCm / 100;
  const bmi = goalWeightKg / (heightM * heightM);
  return bmi < 18.5;
}
