import { CreateEventForm } from "@/components/create-event-form";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--color-cream)] to-white">
      <div className="mx-auto max-w-lg px-4 py-12">
        <Link href="/" className="text-sm text-[var(--color-muted)] hover:underline">
          ← Momenti
        </Link>
        <h1 className="mt-6 font-display text-3xl">ღონისძიება წუთში</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          შექმენით, მიიღეთ QR და ჰოსტის ლინკი. გადახდის შემდეგ სტუმრები ატვირთავენ.
        </p>
        <div className="mt-8">
          <CreateEventForm />
        </div>
      </div>
    </main>
  );
}
