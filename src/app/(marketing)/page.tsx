import { LandingV9 } from "@/components/marketing/landing-v9";

export const revalidate = 3600;

/** Static marketing shell; locale toggle adjusts cookie client-side. */
export default function HomePage() {
  return <LandingV9 locale="ka" />;
}
