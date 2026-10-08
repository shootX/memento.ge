export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { installConsoleRedaction } = await import("@/lib/safe-log");
    installConsoleRedaction();
    const { recoverStaleProcessingJobs, drainMediaDerivativeJobs } = await import(
      "@/lib/jobs/media-derivatives"
    );
    void recoverStaleProcessingJobs().then(() => drainMediaDerivativeJobs());
  }
}
