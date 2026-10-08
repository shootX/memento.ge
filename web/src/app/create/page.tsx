import { CreateEventForm } from "@/components/create-event-form";
import Link from "next/link";

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <Link href="/" className="text-sm text-[var(--color-muted)] hover:underline">
        ← მთავარი
      </Link>
      <h1 className="mt-6 font-display text-3xl">ახალი ღონისძიება</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        შექმნის შემდეგ მიიღებთ ჰოსტის პანელს და QR ბარათებს.
      </p>
      <div className="mt-8">
        <CreateEventForm />
      </div>
    </main>
  );
}
