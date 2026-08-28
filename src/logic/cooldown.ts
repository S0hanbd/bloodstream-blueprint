import { differenceInCalendarDays, addDays, format, parseISO, startOfDay } from "date-fns";

export const DONATION_COOLDOWN_DAYS = 90;

export interface CooldownStatus {
  isEligible: boolean;
  daysSince: number;
  daysRemaining: number;
  nextEligibleDate: Date | null;
  formattedNextEligibleDate: string;
}

export function calculateDonationEligibility(
  lastDonationDate: string | Date | null | undefined,
  referenceDate: Date = new Date()
): CooldownStatus {
  if (!lastDonationDate) {
    return {
      isEligible: true,
      daysSince: Infinity,
      daysRemaining: 0,
      nextEligibleDate: null,
      formattedNextEligibleDate: "Immediately",
    };
  }

  const parsedDate =
    typeof lastDonationDate === "string"
      ? parseISO(lastDonationDate)
      : lastDonationDate;

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return {
      isEligible: true,
      daysSince: Infinity,
      daysRemaining: 0,
      nextEligibleDate: null,
      formattedNextEligibleDate: "Immediately",
    };
  }

  const lastDateStart = startOfDay(parsedDate);
  const refDateStart = startOfDay(referenceDate);

  const daysSince = differenceInCalendarDays(refDateStart, lastDateStart);
  const daysRemaining = Math.max(0, DONATION_COOLDOWN_DAYS - daysSince);
  const isEligible = daysSince >= DONATION_COOLDOWN_DAYS;
  const nextEligibleDate = addDays(lastDateStart, DONATION_COOLDOWN_DAYS);
  const formattedNextEligibleDate = format(nextEligibleDate, "MMMM d, yyyy");

  return {
    isEligible,
    daysSince,
    daysRemaining,
    nextEligibleDate,
    formattedNextEligibleDate,
  };
}
