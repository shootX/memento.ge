import { CreateEventForm } from "@/components/create-event-form";
import Link from "next/link";
import { ColorfulShell } from "@/components/colorful-shell";

export default function OnboardingPage() {
  return (
    <ColorfulShell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <Link href="/" className="text-sm font-bold text-[var(--pink)]">
          ← Memento
        </Link>
        <p className="mt-6 text-4xl">🎉</p>
        <h1 className="mt-2 font-display text-4xl font-bold">ღონისძიება წუთში</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          QR, ჰოსტის ლინკი და სლაიდშოუ — გადახდის შემდეგ სტუმრები ატვირთავენ.
        </p>
        <div className="mt-8 card-chunky p-6">
          <CreateEventForm />
        </div>
      </div>
    </ColorfulShell>
  );
}
