import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelBookingAction, modifyBookingAction } from "./actions";
import { formatTime, getTodayDateString } from "@/lib/booking/utils";
import { logoutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import ProgressiveBookingWizard from "./progressive-booking-wizard";

type AvailabilityPageProps = {
  searchParams: Promise<{ date?: string; error?: string; success?: string }>;
};

export default async function AvailabilityPage({ searchParams }: AvailabilityPageProps) {
  const params = await searchParams;
  const selectedDate = params.date ?? getTodayDateString();
  const paymentsEnabled = Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!hasSupabaseEnv()) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-amber-300/30 bg-amber-300/10 p-6">
          <h1 className="text-2xl font-bold text-amber-100">Booking Setup Required</h1>
          <p className="mt-2 text-sm text-amber-50">
            Add Supabase keys in `.env.local` and run `supabase/schema.sql` before using the availability system.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-emerald-200 hover:text-emerald-100">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/availability?date=${selectedDate}`)}`);
  }

  const [{ data: profile }, { data: slots }, { data: bookings }, { data: availableForModify }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("time_slots")
      .select("id, slot_date, start_time, end_time, status")
      .eq("slot_date", selectedDate)
      .order("start_time"),
    supabase
      .from("bookings")
      .select("id, slot_id, status, customer_name, phone, contact_email, food_items")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("time_slots")
      .select("id, slot_date, start_time, end_time")
      .eq("status", "available")
      .gte("slot_date", selectedDate)
      .order("slot_date")
      .order("start_time"),
  ]);

  const activeSlotIds = (bookings ?? []).map((booking) => booking.slot_id);
  const { data: bookingSlots } =
    activeSlotIds.length > 0
      ? await supabase
          .from("time_slots")
          .select("id, slot_date, start_time, end_time")
          .in("id", activeSlotIds)
      : { data: [] };

  const slotById = new Map<string, { slot_date: string; start_time: string; end_time: string }>();
  for (const slot of bookingSlots ?? []) {
    slotById.set(slot.id, {
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-200">Logged in as {user.email}</p>
              <h1 className="mt-1 text-3xl font-bold">Check Availability</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {profile?.role === "admin" ? (
                <Link
                  href="/admin/availability"
                  className="rounded-full border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-200"
                >
                  Admin Calendar
                </Link>
              ) : null}
              <Link
                href="/"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-emerald-300 hover:text-emerald-200"
              >
                Home
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>

        {params.error ? (
          <p className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {params.error}
          </p>
        ) : null}
        {params.success ? (
          <p className="rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            {params.success}
          </p>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Book Your Slot</h2>
              <p className="mt-1 text-sm text-slate-300">
                Progressively complete booking: date, time, details, then payment.
              </p>
            </div>
          </div>

          <ProgressiveBookingWizard
            key={selectedDate}
            selectedDate={selectedDate}
            minDate={getTodayDateString()}
            paymentsEnabled={paymentsEnabled}
            slots={
              (slots ?? []).map((slot) => ({
                id: slot.id,
                start_time: slot.start_time,
                end_time: slot.end_time,
                status: slot.status,
              })) ?? []
            }
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-2xl font-bold">Your Active Bookings</h2>
          <p className="mt-1 text-sm text-slate-300">Modify or cancel your existing bookings.</p>

          <div className="mt-5 space-y-4">
            {(bookings ?? []).length === 0 ? (
              <p className="text-sm text-slate-300">You do not have active bookings right now.</p>
            ) : (
              (bookings ?? []).map((booking) => {
                const bookedSlot = slotById.get(booking.slot_id);

                return (
                <article key={booking.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="font-semibold">
                    {bookedSlot?.slot_date ?? "Date unavailable"} |{" "}
                    {formatTime(bookedSlot?.start_time ?? "00:00:00")} -{" "}
                    {formatTime(bookedSlot?.end_time ?? "00:00:00")}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Name: {booking.customer_name ?? "-"} | Phone: {booking.phone ?? "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Email: {booking.contact_email ?? "Not provided"}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Food: {Array.isArray(booking.food_items) && booking.food_items.length > 0 ? booking.food_items.join(", ") : "No pre-booked items"}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                    <form action={modifyBookingAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="date" value={selectedDate} />
                      <label htmlFor={`new-slot-${booking.id}`} className="text-sm text-slate-300">
                        Modify Booking
                      </label>
                      <select
                        id={`new-slot-${booking.id}`}
                        name="newSlotId"
                        required
                        className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
                      >
                        <option value="">Select new slot</option>
                        {(availableForModify ?? []).map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.slot_date} | {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200"
                      >
                        Modify Booking
                      </button>
                    </form>

                    <form action={cancelBookingAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="date" value={selectedDate} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300"
                      >
                        Cancel Booking
                      </button>
                    </form>
                  </div>
                </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
