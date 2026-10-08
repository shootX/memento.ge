let warned = false;

/** Log once per process when legacy BOG webhook path is used. */
export function logBogDeprecatedCallbackPath(): void {
  if (warned) return;
  warned = true;
  console.warn(
    "[memento][bog] deprecated callback path /api/webhooks/bog — register /api/payments/bog/callback in BOG portal",
  );
}

export function resetBogDeprecatedLogForTests(): void {
  warned = false;
}
