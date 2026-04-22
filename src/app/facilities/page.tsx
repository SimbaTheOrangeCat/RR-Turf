import Link from "next/link";

const facilities = [
  {
    title: "PS5 Playing Area",
    description: "Enjoy console gaming between matches in a dedicated zone.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M4.5 10.2c0-1.6 1.2-2.8 2.8-2.8h9.4c1.6 0 2.8 1.2 2.8 2.8v4.2c0 1.6-1.2 2.8-2.8 2.8h-1.6v-2.3h-6.2v2.3H7.3c-1.6 0-2.8-1.2-2.8-2.8v-4.2Zm5.4.5h1.4v1.4h1.4v1.4h-1.4v1.4H9.9v-1.4H8.5v-1.4h1.4v-1.4Zm5.9 1.7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm2.2-1.7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
      </svg>
    ),
  },
  {
    title: "Food and Drinks",
    description: "Grab quick snacks and refreshments right at the venue.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M6.2 3.5h1.6V9A2.8 2.8 0 0 1 5 11.8v8.7H3.4v-8.7A2.8 2.8 0 0 1 .6 9V3.5h1.6v5.2c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2V3.5Zm8.8 0h3.5A4.5 4.5 0 0 1 23 8v12.5h-1.7V14h-4.6v6.5H15V3.5Zm1.7 8.8h4.6V8a2.8 2.8 0 0 0-2.8-2.8h-1.8v7.1Z" />
      </svg>
    ),
  },
  {
    title: "Washroom",
    description: "Clean and well-maintained washrooms for all players.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M7.4 2.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm8.8 0a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM6.3 8.2h2.2v4.2l2.1 2.1-1.1 1.1-2.4-2.4a1.6 1.6 0 0 1-.5-1.1V8.2Zm9.2 0h2.2v3.9h1.5v1.7h-1.5v6.7H16v-6.7h-1.8v-1.7H16V8.2Z" />
      </svg>
    ),
  },
  {
    title: "Changing Room",
    description: "Comfortable changing space to gear up before and after play.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M12 2.5a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6Zm-5 6.2h10a2 2 0 0 1 2 2v9.8h-1.8v-4.3H6.8v4.3H5V10.7a2 2 0 0 1 2-2Zm-.2 5.7h10.4v-3.7H6.8v3.7Z" />
      </svg>
    ),
  },
  {
    title: "Sitting Area",
    description: "Relaxing seating for teams, families, and waiting players.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M4 10.3A3.3 3.3 0 0 1 7.3 7h9.4a3.3 3.3 0 0 1 3.3 3.3v4.2h-1.8v-1.4H5.8v1.4H4v-4.2Zm1.8 7h12.4v1.7h-1.8v2H14.6v-2H9.4v2H7.6v-2H5.8v-1.7Z" />
      </svg>
    ),
  },
  {
    title: "Gallery",
    description: "Capture and share your match moments from our photo spots.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M4 5.5h16A2.5 2.5 0 0 1 22.5 8v8A2.5 2.5 0 0 1 20 18.5H4A2.5 2.5 0 0 1 1.5 16V8A2.5 2.5 0 0 1 4 5.5Zm0 1.7A.8.8 0 0 0 3.2 8v8c0 .4.4.8.8.8h16c.4 0 .8-.4.8-.8V8a.8.8 0 0 0-.8-.8H4Zm3 7.8 2.4-3 2 2.4 3-3.8 3.6 4.4H7Zm3.2-6.5a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z" />
      </svg>
    ),
  },
  {
    title: "AC Room for Rest",
    description: "Cool down and recover in a dedicated air-conditioned room.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M12 2.5a.9.9 0 0 1 .9.9v3.1l2.7-1.5a.9.9 0 1 1 .9 1.5L13.8 8l2.7 1.5a.9.9 0 1 1-.9 1.5l-2.7-1.5v3.1a.9.9 0 1 1-1.8 0V9.5l-2.7 1.5a.9.9 0 1 1-.9-1.5L10.2 8 7.5 6.5a.9.9 0 0 1 .9-1.5l2.7 1.5V3.4a.9.9 0 0 1 .9-.9Zm-6.8 14h13.6v1.8H5.2v-1.8Z" />
      </svg>
    ),
  },
  {
    title: "First Aid Kit",
    description: "Basic first aid support kept ready for immediate care.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M8 4h8a2.5 2.5 0 0 1 2.5 2.5V8H21a1 1 0 0 1 1 1v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a1 1 0 0 1 1-1h2.5V6.5A2.5 2.5 0 0 1 8 4Zm0 1.8a.7.7 0 0 0-.7.7V8h9.4V6.5a.7.7 0 0 0-.7-.7H8Zm2.8 5.2v2H8.8v2h2v2h2v-2h2v-2h-2v-2h-2Z" />
      </svg>
    ),
  },
];

export default function FacilitiesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-emerald-200"
        >
          Back to Home
        </Link>

        <div className="mt-8 max-w-2xl space-y-3">
          <p className="inline-block rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-200">
            Explore Facilities
          </p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Everything You Need at RR Turf
          </h1>
          <p className="text-slate-300">
            From match-ready amenities to comfort zones, our facilities are
            designed for a smooth and modern playing experience.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <article
              key={facility.title}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-slate-900"
            >
              <div className="inline-flex rounded-xl border border-emerald-300/40 bg-emerald-300/10 p-2 text-emerald-200">
                {facility.icon}
              </div>
              <h2 className="mt-4 text-xl font-semibold">{facility.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{facility.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
