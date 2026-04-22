import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function Home() {
  const supabaseReady = hasSupabaseEnv();
  let user: { id: string } | null = null;
  let profile: { role: string } | null = null;

  if (supabaseReady) {
    const supabase = await createClient();
    const authResult = await supabase.auth.getUser();
    user = authResult.data.user ? { id: authResult.data.user.id } : null;
    profile = user ? (await supabase.from("profiles").select("role").eq("id", user.id).single()).data : null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <p className="text-xl font-black tracking-tight">RR Turf</p>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#sports" className="transition hover:text-emerald-300">
              Sports
            </a>
            <a href="#booking" className="transition hover:text-emerald-300">
              Booking
            </a>
            <a href="#contact" className="transition hover:text-emerald-300">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {profile?.role === "admin" ? (
                  <Link
                    href="/admin/availability"
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-emerald-300 hover:text-emerald-200"
                  >
                    Admin
                  </Link>
                ) : null}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href={supabaseReady ? "/login" : "#booking"}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-emerald-300 hover:text-emerald-200"
                >
                  Sign In
                </Link>
                <Link
                  href={supabaseReady ? "/signup" : "#booking"}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <p className="inline-block rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-200">
              Artificial Turf Ground
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Play Football and Cricket at RR Turf
            </h1>
            <p className="max-w-xl text-slate-300">
              Premium turf experience with easy advance booking, prime-time
              slots, and a clean, safe playing environment for your team.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={supabaseReady ? (user ? "/availability" : "/login?next=/availability") : "#booking"}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Check Availability
              </Link>
              <Link
                href="/facilities"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-300 hover:text-emerald-200"
              >
                Explore Facilities
              </Link>
            </div>
          </div>

          <div className="relative min-h-80 overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/30">
            <Image
              src="https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Players enjoying football on a green ground"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </section>

        <section id="sports" className="border-y border-white/10 bg-slate-900/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-bold">Games Available</h2>
            <p className="mt-2 max-w-2xl text-slate-300">
              Choose your sport and reserve your preferred time slot in advance.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
                <p className="text-sm font-semibold text-emerald-200">Football</p>
                <h3 className="mt-2 text-xl font-semibold">Net and Match Play</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Practice matches, friendly games, or team training on quality
                  artificial grass.
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
                <p className="text-sm font-semibold text-sky-200">Cricket</p>
                <h3 className="mt-2 text-xl font-semibold">Net and Match Play</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Book slots for batting practice, bowling drills, or group
                  sessions with your squad.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="booking" className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold">How Booking Works</h2>
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm font-semibold text-emerald-100">
            Sign In or Sign Up is required before making a booking inquiry.
          </div>
          {!supabaseReady ? (
            <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">
              Booking system setup pending. Add Supabase keys in `.env.local` and run the SQL in `supabase/schema.sql`.
            </div>
          ) : null}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold text-emerald-200">Step 1</p>
              <p className="mt-2 text-sm text-slate-200">
                Choose sport, date, and preferred slot.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold text-emerald-200">Step 2</p>
              <p className="mt-2 text-sm text-slate-200">
                Submit your booking request with contact details.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold text-emerald-200">Step 3</p>
              <p className="mt-2 text-sm text-slate-200">
                Receive confirmation from RR Turf management.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-white/10 bg-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-extrabold text-white">
              RR Turf - Book in advance. Play hassle-free.
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              Contact: +91 90000 00000 | rrturf@example.com
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Instagram"
              className="rounded-full border border-white/20 p-2 text-slate-200 transition hover:border-pink-400 hover:text-pink-300"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.95 1.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="rounded-full border border-white/20 p-2 text-slate-200 transition hover:border-sky-400 hover:text-sky-300"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M13.5 22v-8.2h2.8l.42-3.2H13.5V8.55c0-.93.28-1.56 1.63-1.56h1.74V4.1c-.3-.04-1.34-.1-2.54-.1-2.5 0-4.22 1.48-4.22 4.22v2.38H7.2v3.2h2.86V22h3.44Z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
