export function validateCustomSlug(slug: string): { ok: true } | { ok: false; message: string } {
  const trimmed = slug.trim();
  if (!trimmed) return { ok: true };
  if (trimmed.length < 3 || trimmed.length > 40) {
    return {
      ok: false,
      message: "მისამართი უნდა იყოს 3–40 სიმბოლო.",
    };
  }
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return {
      ok: false,
      message: "დაშვებულია მხოლოდ პატარა ლათინური ასოები, ციფრები და ტire (-).",
    };
  }
  return { ok: true };
}
