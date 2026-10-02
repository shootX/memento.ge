const MEMENTO_SCHEME = "memento:";

/** Deep links and app return URLs must use the memento:// scheme only. */
export function isAllowedMementoUri(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === MEMENTO_SCHEME;
  } catch {
    return false;
  }
}

export function assertAllowedMementoUri(value: string): string | null {
  if (!isAllowedMementoUri(value)) return null;
  return value;
}
