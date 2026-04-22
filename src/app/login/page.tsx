import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!hasSupabaseEnv()) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-amber-300/30 bg-amber-300/10 p-6">
          <h1 className="text-2xl font-bold text-amber-100">Auth Setup Required</h1>
          <p className="mt-2 text-sm text-amber-50">
            Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-emerald-200 hover:text-emerald-100">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const next = params.next ?? "/availability";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="mt-2 text-sm text-slate-300">Login to check and manage your booking slots.</p>

        {params.error ? (
          <p className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {params.error}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 outline-none ring-emerald-300/60 focus:ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 outline-none ring-emerald-300/60 focus:ring"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          New here?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-emerald-300 hover:text-emerald-200">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
