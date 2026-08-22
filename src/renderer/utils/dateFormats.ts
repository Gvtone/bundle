import type { DateFormatKey } from "@/shared/types";

export const DATE_FORMATS: Record<
  DateFormatKey,
  { label: string; format: (isoDate: string) => string }
> = {
  long: {
    label: "January 15, 2026",
    format: isoDate =>
      new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
  }
};
