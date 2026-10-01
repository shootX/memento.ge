export function publicAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    `http://localhost:${process.env.PORT ?? "43123"}`
  );
}
