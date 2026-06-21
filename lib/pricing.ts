export const JOB_TYPES = ["driveway", "walkway", "car"] as const;
export const SIZES = ["small", "medium", "large"] as const;

export type JobType = (typeof JOB_TYPES)[number];
export type Size = (typeof SIZES)[number];

export const PRICES: Record<JobType, Partial<Record<Size, number>>> = {
  driveway: { small: 49, medium: 79, large: 109 },
  walkway: { small: 29, medium: 49 },
  car: { small: 39 },
};

export const JOB_LABELS: Record<JobType, string> = {
  driveway: "Driveway Plow",
  walkway: "Walkway Clearance",
  car: "Car Dig-Out",
};

export const SIZE_LABELS: Record<Size, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function getPrice(jobType: JobType, size: Size): number | null {
  return PRICES[jobType]?.[size] ?? null;
}

export function getAvailableSizes(jobType: JobType): Size[] {
  return SIZES.filter((s) => PRICES[jobType][s] !== undefined);
}
