import { createHash } from "crypto";

/**
 * Flitt signature per https://docs.flitt.com/api/building-signature/
 * SHA1(secret|param1|param2|...) sorted alphabetically by key, skip empty values and signature fields.
 */
export function flittBuildSignature(
  secret: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const keys = Object.keys(params)
    .filter(
      (k) =>
        k !== "signature" &&
        k !== "response_signature_string" &&
        params[k] !== undefined &&
        params[k] !== null &&
        String(params[k]) !== "",
    )
    .sort();

  const parts = [secret, ...keys.map((k) => String(params[k]))];
  return createHash("sha1").update(parts.join("|")).digest("hex").toLowerCase();
}

export function flittVerifyCallback(
  secret: string,
  params: Record<string, string | number | undefined | null>,
): boolean {
  const sig = params.signature;
  if (!sig || typeof sig !== "string") return false;
  const expected = flittBuildSignature(secret, params);
  return expected === sig.toLowerCase();
}

/** Amount in GEL major units → Flitt minor units (tetri) */
export function flittAmountMinorUnits(amountGel: number): number {
  return Math.round(amountGel * 100);
}
