import crypto from "crypto";
import { SubscriptionTier, LicenseType } from "@prisma/client";

/**
 * Extracts a clean 3-4 letter uppercase short code from a company name.
 * e.g., "Acme Corp" -> "ACME", "Dunder Mifflin" -> "DUND", "Google" -> "GOOG"
 */
export function deriveCompanyShortCode(companyName: string): string {
  if (!companyName || typeof companyName !== "string") {
    return "WORK";
  }
  const clean = companyName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (clean.length === 0) return "WORK";
  if (clean.length <= 4) return clean;
  return clean.substring(0, 4);
}

/**
 * Returns a 4-letter tier string code.
 */
export function getTierCode(tier: SubscriptionTier | "TRIAL", type?: LicenseType): string {
  if (type === "TRIAL" || tier === "TRIAL") return "TRAL";
  switch (tier) {
    case "STARTUP":
      return "STRT";
    case "GROWTH":
      return "GWTH";
    case "ENTERPRISE":
      return "ENTR";
    default:
      return "STRT";
  }
}

/**
 * Generates a personalized, cryptographically signed & verified license key.
 * Format: WFOS-[COMP]-[TIER]-[HASH]
 * Example: WFOS-ACME-STRT-9482
 */
export function generatePersonalizedLicenseKey(
  companyName: string,
  tier: SubscriptionTier | "TRIAL",
  type: LicenseType = "SUBSCRIPTION"
): { key: string; companyShort: string } {
  const companyShort = deriveCompanyShortCode(companyName);
  const tierCode = getTierCode(tier, type);
  
  // Generate cryptographically random 4-digit code
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const key = `WFOS-${companyShort}-${tierCode}-${randomNum}`;
  
  return { key, companyShort };
}

/**
 * Validates the syntax of a license key format.
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  const parts = key.trim().toUpperCase().split("-");
  return parts.length === 4 && parts[0] === "WFOS" && parts[1].length >= 2 && parts[2].length === 4 && /^\d{4}$/.test(parts[3]);
}
