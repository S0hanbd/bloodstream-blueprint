export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
export const BD_PHONE_REGEX = /^(?:\+?880|0)?1[3-9]\d{8}$/;

/**
 * Validates international & Bangladeshi phone numbers (013-019 operator prefixes, +8801..., or E.164)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const sanitized = phone.trim();
  return PHONE_REGEX.test(sanitized) || BD_PHONE_REGEX.test(sanitized);
}

/**
 * Strips non-numeric characters for ID fields (UAP ID, National ID)
 */
export function maskNumericId(value: string, maxLength: number = 17): string {
  if (!value) return "";
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.slice(0, maxLength);
}

/**
 * Sanitizes phone input text allowing leading '+' followed by digits
 */
export function maskPhoneNumber(value: string): string {
  if (!value) return "";
  const cleaned = value.replace(/[^\d+]/g, "");
  // Ensure '+' only appears at index 0
  if (cleaned.startsWith("+")) {
    return "+" + cleaned.slice(1).replace(/\+/g, "").slice(0, 14);
  }
  return cleaned.replace(/\+/g, "").slice(0, 15);
}
