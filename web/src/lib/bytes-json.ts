/** Serialize Prisma BigInt fields for JSON APIs. */
export function bigintToNumber(n: bigint | number, field = "bytes"): number {
  if (typeof n === "number") return n;
  if (n > BigInt(Number.MAX_SAFE_INTEGER) || n < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError(`${field} exceeds JS safe integer`);
  }
  return Number(n);
}

export function serializeEventBytes(event: { totalBytes: bigint | number }): number {
  return bigintToNumber(event.totalBytes, "totalBytes");
}
