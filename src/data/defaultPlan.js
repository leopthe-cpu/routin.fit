// The starter plan, kept in the same free-text format users paste in.
// It goes through the same parser as any imported plan.
//
// "@ 31kg" is a starting weight from the user's logged history; "@ ~16kg" is
// an estimate from similar exercises, to be corrected at the gym.
export const DEFAULT_PLAN_NAME = 'Dumbbell Split';

const MORNING =
  '* Morning Routine (5 min): 90/90 hip/groin opener, wrist/ankle circles, cat-cow stretch, shoulder pass-throughs (with band/stick).';

export const DEFAULT_PLAN_TEXT = `Mon: Chest & Biceps

${MORNING}
* Incline Dumbbell Bench Press: 3x6-8 @ 31kg
* Flat Dumbbell Bench Press: 3x8-10 @ 42.5kg
* Dumbbell Squeeze Press: 3x10-12 @ ~20kg
* Seated Incline Dumbbell Curls: 3x10-12 @ 11.5kg
* Standing EZ-Bar Curls: 3x8-10 @ ~16kg
* Hanging Leg Raises: 3x12-15

Tue: Back, Rear Delts & Traps

${MORNING}
* Single-Arm Dumbbell Rows: 3x6-8 @ 26.5kg
* Chest-Supported Dumbbell Rows: 3x8-10 @ ~16kg
* Dumbbell Pullovers: 3x10-12 @ 22.7kg
* Dumbbell Reverse Flies: 3x12-15 @ ~8kg
* Heavy Dumbbell Shrugs: 3x8-10 @ ~20kg
* Weighted Decline Sit-ups: 3x12-15 @ 5kg

Wed: Legs & Core

${MORNING}
* Goblet Squat: 3x8-10 @ ~16kg
* Dumbbell Romanian Deadlift: 3x8-10 @ ~14kg
* Bulgarian Split Squat: 3x8-10 each leg @ ~8kg
* Seated Leg Curl: 3x10-12 @ ~30kg
* Standing Calf Raises: 3x12-15 @ ~12kg
* Plank: 3x 45-60 sec hold

Thu: Shoulders & Triceps

${MORNING}
* Seated Dumbbell Shoulder Press: 3x6-8 @ 12kg
* Dumbbell Lateral Raises: 3x12-15 @ 7kg
* Dumbbell Skull Crushers: 3x8-10 @ 13.5kg
* Overhead Dumbbell Extension: 3x10-12 @ 20kg
* Lying Leg Raises: 3xFailure
* Weighted Russian Twists: 3x15-20 @ 17.5kg

Fri: Rest Day
REST DAY

${MORNING}
* Active Recovery: Light 20-30 min walk or gentle stretching for blood flow.

Sat: Upper Body, Forearms & Rear Delts

${MORNING}
* Flat Dumbbell Bench Press: 3x6-8 @ 42.5kg
* Face Pulls (or Banded/Cable Rear Delt Pulls): 3x12-15 @ ~22kg
* Standing Hammer Curls + Dumbbell Kickbacks (Superset): 3x10-12 each @ 15.5kg / ~4kg
* Seated Wrist Curls: 3x12-15 @ ~6kg
* Dead Hangs & Scapular Pull-Ups: 3x 30-45 sec hold (Gym only)
* Neck Bridges (Careful execution / light bodyweight integration): 2x 10-15 reps or short holds (Gym/Safe mat area)
* Dumbbell Floor Press: 3x10-12 @ ~12kg

Sun: Rest Day
REST DAY

${MORNING}
* Active Recovery: Light 20-30 min walk or gentle stretching for blood flow.
* Sleep: Aim for 7-9 hours to maximize Growth Hormone release for repair.
* Nutrition: Stay hydrated and eat well.
`;
