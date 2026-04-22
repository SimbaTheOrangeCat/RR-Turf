import Link from "next/link";
import { redirect } from "next/navigation";
import {
  cancelBookingAction,
  generateCustomSlotsForRangeAction,
  generateDefaultSlotsForRangeAction,
  modifyBookingAction,
  updateSlotStatusAction,
} from "@/app/availability/actions";
import { getTodayDateString, formatTime } from "@/lib/booking/utils";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type AdminAvailabilityPageProps = {
  searchParams: Promise<{ date?: string; startDate?: string; endDate?: string; error?: string; success?: string }>;
};

export default async function AdminAvailabilityPage({ searchParams }: AdminAvailabilityPageProps) {
  const params = await searchParams;
  const selectedDate = params.date ?? params.startDate ?? getTodayDateString();
  const startDate = params.startDate ?? selectedDate;
  const endDate = params.endDate ?? startDate;

  if (!hasSupabaseEnv()) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-amber-300/30 bg-amber-300/10 p-6">
          <h1 className="text-2xl font-bold text-amber-100">Booking Setup Required</h1>
          <p className="mt-2 text-sm text-amber-50">
            Add Supabase keys in `.env.local` and run `supabase/schema.sql` before opening admin availability.
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
    redirect(
      `/login?next=${encodeURIComponent(`/admin/availability?startDate=${startDate}&endDate=${endDate}`)}`,
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    redirect("/availability?error=Admin access required");
  }

  const { data: slots } = await supabase
    .from("time_slots")
    .select("id, slot_date, start_time, end_time, status")
    .gte("slot_date", startDate)
    .lte("slot_date", endDate)
    .order("slot_date")
    .order("start_time");

  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("id, slot_id, user_id, customer_name, phone, contact_email, food_items, advance_payment_amount, payment_status")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const bookingSlotIds = (activeBookings ?? []).map((booking) => booking.slot_id);
  const { data: bookingSlots } =
    bookingSlotIds.length > 0
      ? await supabase
          .from("time_slots")
          .select("id, slot_date, start_time, end_time")
          .in("id", bookingSlotIds)
      : { data: [] };

  const bookingSlotById = new Map<string, { slot_date: string; start_time: string; end_time: string }>();
  for (const slot of bookingSlots ?? []) {
    bookingSlotById.set(slot.id, {
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
  }

  const availableSlotsForModify = (slots ?? []).filter((slot) => slot.status === "available");
  const activeBookingsForSelectedDate = (activeBookings ?? []).filter((booking) => {
    const slot = bookingSlotById.get(booking.slot_id);
    return slot?.slot_date === selectedDate;
  });

  const slotsByDate = new Map<string, typeof slots>();
  for (const slot of slots ?? []) {
    if (!slotsByDate.has(slot.slot_date)) {
      slotsByDate.set(slot.slot_date, []);
    }
    slotsByDate.get(slot.slot_date)?.push(slot);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div>
            <p className="text-sm text-emerald-200">Admin Panel</p>
            <h1 className="mt-1 text-3xl font-bold">Availability Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/availability"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-emerald-300 hover:text-emerald-200"
            >
              User View
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-emerald-300 hover:text-emerald-200"
            >
              Home
            </Link>
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
          <div className="grid gap-4 md:grid-cols-2">
            <form method="get" className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-emerald-200">1) Select Date Range</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Start Date
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={startDate}
                    min={getTodayDateString()}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  End Date
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={endDate}
                    min={startDate}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="mt-3 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Apply Range
              </button>
            </form>

            <form action={generateDefaultSlotsForRangeAction} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-emerald-200">2) Generate Default Slots (Selected Range)</p>
              <p className="mt-1 text-xs text-slate-300">Creates 6:00 AM to 2:00 AM slots for each date.</p>
              <input type="hidden" name="startDate" value={startDate} />
              <input type="hidden" name="endDate" value={endDate} />
              <button
                type="submit"
                className="mt-3 rounded-lg border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200"
              >
                Generate Default for Range
              </button>
            </form>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <form action={generateCustomSlotsForRangeAction} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-emerald-200">3) Generate Custom Slots (Selected Range)</p>
              <p className="mt-1 text-xs text-slate-300">Set custom hours (24h format), 1-hour slot duration.</p>
              <input type="hidden" name="startDate" value={startDate} />
              <input type="hidden" name="endDate" value={endDate} />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Start Hour
                  <input
                    type="number"
                    name="customStartHour"
                    min={0}
                    max={23}
                    defaultValue={6}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  End Hour
                  <input
                    type="number"
                    name="customEndHour"
                    min={1}
                    max={24}
                    defaultValue={23}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="mt-3 rounded-lg border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200"
              >
                Generate Custom for Range
              </button>
            </form>

            <form method="get" className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-emerald-200">4) View Schedule / Bookings for Specific Date</p>
              <label className="mt-3 block text-sm text-slate-300">
                Specific Date
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  min={getTodayDateString()}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="mt-3 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                View Specific Date
              </button>
            </form>
          </div>

          <div className="mt-6 space-y-6">
            {(slots ?? []).length === 0 ? (
              <p className="text-sm text-slate-300">No slots found for this date range. Generate defaults first.</p>
            ) : (
              Array.from(slotsByDate.entries()).map(([slotDate, daySlots]) => (
                <section key={slotDate}>
                  <h3 className="mb-3 text-lg font-bold text-emerald-200">{slotDate}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(daySlots ?? []).map((slot) => (
                      <article key={slot.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                        <p className="font-semibold">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">Current: {slot.status}</p>
                        <form action={updateSlotStatusAction} className="mt-3 flex items-center gap-2">
                          <input type="hidden" name="slotId" value={slot.id} />
                          <input type="hidden" name="date" value={slotDate} />
                          <input type="hidden" name="startDate" value={startDate} />
                          <input type="hidden" name="endDate" value={endDate} />
                          <select
                            name="status"
                            defaultValue={slot.status}
                            className="rounded-lg bg-slate-900 px-2 py-2 text-sm"
                          >
                            <option value="available">available</option>
                            <option value="booked">booked</option>
                            <option value="blocked">blocked</option>
                          </select>
                          <button
                            type="submit"
                            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold transition hover:border-emerald-300"
                          >
                            Save
                          </button>
                        </form>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-2xl font-bold">Active Bookings</h2>
          <p className="mt-1 text-sm text-slate-300">
            View details and modify or cancel bookings for {selectedDate}.
          </p>

          <div className="mt-5 space-y-4">
            {activeBookingsForSelectedDate.length === 0 ? (
              <p className="text-sm text-slate-300">No active bookings at the moment.</p>
            ) : (
              activeBookingsForSelectedDate.map((booking) => {
                const slot = bookingSlotById.get(booking.slot_id);
                const redirectTo = `/admin/availability?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

                return (
                  <article key={booking.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="font-semibold">
                      {slot?.slot_date ?? "Date unavailable"} | {formatTime(slot?.start_time ?? "00:00:00")} -{" "}
                      {formatTime(slot?.end_time ?? "00:00:00")}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Name: {booking.customer_name ?? "-"} | Phone: {booking.phone ?? "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">Email: {booking.contact_email ?? "Not provided"}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Food:{" "}
                      {Array.isArray(booking.food_items) && booking.food_items.length > 0
                        ? booking.food_items.join(", ")
                        : "No pre-booked items"}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Advance: INR {booking.advance_payment_amount ?? 200} | Payment: {booking.payment_status ?? "pending"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Booked user ID: {booking.user_id}</p>

                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                      <form action={modifyBookingAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="date" value={slot?.slot_date ?? selectedDate} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <label htmlFor={`admin-new-slot-${booking.id}`} className="text-sm text-slate-300">
                          Modify Booking
                        </label>
                        <select
                          id={`admin-new-slot-${booking.id}`}
                          name="newSlotId"
                          required
                          className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
                        >
                          <option value="">Select new slot</option>
                          {availableSlotsForModify.map((availableSlot) => (
                            <option key={availableSlot.id} value={availableSlot.id}>
                              {availableSlot.slot_date} | {formatTime(availableSlot.start_time)} -{" "}
                              {formatTime(availableSlot.end_time)}
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
                        <input type="hidden" name="date" value={slot?.slot_date ?? selectedDate} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
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
