import Image from "next/image";

const steps = [
  {
    title: "QR მაგიდაზე",
    text: "ბეჭდავ ფერად ბარათებს — სტუმარი QR-ით შემოდის.",
    img: "/seed-samples/wedding-3.jpg",
  },
  {
    title: "ატვირთვა",
    text: "ფოტო და მოკლე ვიდეო პირდაპირ ალბომში — აპის გარეშე.",
    img: "/seed-samples/wedding-5.jpg",
  },
  {
    title: "ლაივ სლაიდშოუ",
    text: "ახალი კადრები ეკრანზე — ტელევიზორზეც.",
    img: "/seed-samples/wedding-5.jpg",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="section-y container-page">
      <div className="mx-auto max-w-2xl text-center">
        <p className="type-label">როგორ მუშაობს</p>
        <h2 className="type-section-title mt-2">სამი ნაბიჯი საღამომდე</h2>
      </div>
      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="card-chunky overflow-hidden p-0">
            <div className="relative h-40 w-full">
              <Image src={step.img} alt="" fill className="object-cover" sizes="400px" />
              <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white font-display text-lg font-bold shadow-md">
                {i + 1}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-extrabold">{step.title}</h3>
              <p className="mt-2 text-[var(--muted)] leading-relaxed">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
