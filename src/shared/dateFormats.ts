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
  },
  short: {
    label: "Jan 15, 2026",
    format: isoDate =>
      new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
  },
  numeric: {
    label: "01/15/2026",
    format: isoDate =>
      new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
  },
  dayFirst: {
    label: "15 January 2026",
    format: isoDate =>
      new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
  },
  iso: {
    label: "2026-01-15",
    format: isoDate => isoDate
  }
};
