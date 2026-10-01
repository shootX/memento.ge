const faqs = [
  {
    q: "სტუმარს აპი სჭირდება?",
    a: "არა. სკანირება ტელეფონის კამერით და ატვირთვა ბრაუზერში.",
  },
  {
    q: "როგორ ვიღებთ ფოტოებს ქორწილის შემდეგ?",
    a: "ZIP ჩამოტვირთვა ჰოსტის პანელიდან; ვადა დამოკიდებულია პაკეტზე.",
  },
  {
    q: "მუშაობს სუსტ Wi‑Fi-ზე?",
    a: "ატვირთვა ავტომატურად ცდილობს ხელახლა და აკუმშურებს დიდ ფოტოებს.",
  },
  {
    q: "ფოტოგრაფი როგორ გყიდის?",
    a: "Partner დაფაზე white-label და referral კომისია.",
  },
];

export const metadata = { title: "FAQ — Momenti" };

export default function FaqPage() {
  return (
    <main className="px-4 py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-semibold text-center">ხშირი კითხვები</h1>
      <dl className="mt-10 space-y-6">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-2xl border border-[var(--color-border)] bg-white/70 p-6">
            <dt className="font-medium">{f.q}</dt>
            <dd className="mt-2 text-sm text-[var(--color-muted)]">{f.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
