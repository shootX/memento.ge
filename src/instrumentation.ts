export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { installConsoleRedaction } = await import("@/lib/safe-log");
    installConsoleRedaction();
  }
}
