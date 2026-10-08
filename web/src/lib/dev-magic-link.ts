/** Expose magic-link URL in API/UI only in non-production or with explicit opt-in. */
export function shouldExposeDevMagicLink(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.DEV_SHOW_MAGIC_LINK === "1";
  }
  return true;
}
