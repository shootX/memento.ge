import Image from "next/image";

const couples = [
  { names: "ნინო & გიორგი", quote: "სტუმრებმა 400+ ფოტო ატვირთეს ერთ საღამოში.", img: "/seed-samples/wedding-1.jpg" },
  { names: "ანა & დავით", quote: "სლაიდშოუმ ცეკვის დარბაზი ააწვივა.", img: "/seed-samples/wedding-4.jpg" },
  { names: "მარიამ & ლუკა", quote: "QR ბარათები ზუსტად ჩვენს ფერებში.", img: "/seed-samples/wedding-6.jpg" },
];

export function LandingSocialProof() {
  return (
    <section className="section-y border-y-2 border-[var(--border-soft)] bg-white/80">
      <div className="container-page">
        <p className="type-label text-center">დემო გამოხმაურებები</p>
        <h2 className="type-section-title mt-2 text-center">წყვილები, რომლებმაც სცადეს</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[var(--muted)]">
          საჩვენებელი ისტორიები — რეალური ქორწილების სტილის მაგალითები.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {couples.map((c) => (
            <figure key={c.names} className="card-chunky overflow-hidden p-0">
              <div className="relative h-44">
                <Image src={c.img} alt="" fill className="object-cover" sizes="400px" />
              </div>
              <blockquote className="p-5">
                <p className="text-sm leading-relaxed text-[var(--fg-2)]">&ldquo;{c.quote}&rdquo;</p>
                <figcaption className="mt-3 font-display font-bold text-[var(--accent)]">
                  {c.names}
                </figcaption>
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
