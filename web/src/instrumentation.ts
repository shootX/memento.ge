export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertE2eBypassAllowed } = await import("@/lib/production-guards");
    assertE2eBypassAllowed();
    const { installConsoleRedaction } = await import("@/lib/safe-log");
    installConsoleRedaction();
    const { recoverStaleProcessingJobs, drainMediaDerivativeJobs } = await import(
      "@/lib/jobs/media-derivatives"
    );
    void recoverStaleProcessingJobs().then(() => drainMediaDerivativeJobs());
  }
}
