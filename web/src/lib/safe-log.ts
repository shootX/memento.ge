/** Redact secrets/PII before writing to server logs. */

const TOKEN_QUERY_RE =
  /([?&\s](?:token|code|hostToken|payId|access_token|refresh_token|password)=)[^&\s"'<>]+/gi;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const first = local[0] ?? "?";
  return `${first}***@${domain}`;
}

export function redactSensitiveText(text: string): string {
  let out = text.replace(TOKEN_QUERY_RE, "$1[REDACTED]");
  out = out.replace(BEARER_RE, "Bearer [REDACTED]");
  out = out.replace(
    /https?:\/\/[^\s"'<>]*\/api\/auth\/verify\?[^\s"'<>]*/gi,
    "https://[REDACTED]/api/auth/verify?[REDACTED]",
  );
  return out;
}

export function formatLogValue(value: unknown): unknown {
  if (typeof value === "string") return redactSensitiveText(value);
  if (value instanceof Error) {
    return redactSensitiveText(value.message);
  }
  return value;
}

export function safeLogInfo(message: string, ...rest: unknown[]): void {
  console.info(redactSensitiveText(message), ...rest.map(formatLogValue));
}

export function safeLogWarn(message: string, ...rest: unknown[]): void {
  console.warn(redactSensitiveText(message), ...rest.map(formatLogValue));
}

export function installConsoleRedaction(): void {
  if ((globalThis as { __mementoLogRedact?: boolean }).__mementoLogRedact) return;
  (globalThis as { __mementoLogRedact?: boolean }).__mementoLogRedact = true;

  for (const level of ["log", "info", "warn", "error"] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      original(...args.map(formatLogValue));
    };
  }
}
