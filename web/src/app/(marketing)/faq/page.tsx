const faqs = [
  {
    q: "სტუმარს აპი სჭირდება?",
    a: "არა — სკანირება და ატვირთვა ბრაუზერში 📱",
    emoji: "📲",
  },
  {
    q: "როგორ ვიღებთ ფოტოებს?",
    a: "ZIP ჰოსტის პანელიდან; ვადა პაკეტის მიხედვით.",
    emoji: "📦",
  },
  {
    q: "სუსტ Wi‑Fi?",
    a: "ავტომატური retry + კომპრესია დიდ ფოტოებზე.",
    emoji: "📶",
  },
  {
    q: "ფოტოგრაფის გაყიდვა?",
    a: "Partner დაფა · white-label · კომისია.",
    emoji: "🤝",
  },
];

export const metadata = { title: "FAQ — Momenti" };

export default function FaqPage() {
  return (
    <main className="px-4 py-16 max-w-2xl mx-auto">
      <h1 className="text-center font-display text-5xl font-bold">
        FAQ <span className="text-gradient">💬</span>
      </h1>
      <dl className="mt-10 space-y-4">
        {faqs.map((f) => (
          <div key={f.q} className="card-chunky p-6">
            <dt className="flex items-start gap-3 font-extrabold text-lg">
              <span className="text-2xl">{f.emoji}</span>
              {f.q}
            </dt>
            <dd className="mt-2 pl-10 text-[var(--text-muted)]">{f.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
