"use client";

import { useMemo, useState } from "react";

type SlotItem = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
};

type SlotsModalProps = {
  selectedDate: string;
  minDate: string;
  slots: SlotItem[];
  showInitially: boolean;
};

function formatTime(time: string) {
  const [hourRaw, minuteRaw] = time.split(":");
  const hourNum = Number(hourRaw);
  const minute = minuteRaw ?? "00";
  const period = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${hour12}:${minute} ${period}`;
}

export default function SlotsModal({
  selectedDate,
  minDate,
  slots,
  showInitially,
}: SlotsModalProps) {
  const [isOpen, setIsOpen] = useState(showInitially);
  const [date, setDate] = useState(selectedDate);

  const sortedSlots = useMemo(
    () =>
      [...slots].sort((a, b) =>
        a.start_time.localeCompare(b.start_time, undefined, { numeric: true }),
      ),
    [slots],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        Load Slots
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Available Time Slots</h3>
                <p className="mt-1 text-sm text-slate-300">Viewing slots for {selectedDate}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/20 px-3 py-1 text-sm font-semibold transition hover:border-emerald-300 hover:text-emerald-200"
              >
                Close
              </button>
            </div>

            <form method="get" action="/availability" className="mt-4 flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor="modal-date" className="mb-1 block text-sm text-slate-300">
                  Select Date
                </label>
                <input
                  id="modal-date"
                  type="date"
                  name="date"
                  value={date}
                  min={minDate}
                  onChange={(event) => setDate(event.target.value)}
                  className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm outline-none ring-emerald-300/60 focus:ring"
                />
              </div>
              <input type="hidden" name="showSlots" value="1" />
              <button
                type="submit"
                className="rounded-lg border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200"
              >
                View for Date
              </button>
            </form>

            <div className="mt-5 max-h-96 space-y-2 overflow-y-auto pr-1">
              {sortedSlots.length === 0 ? (
                <p className="text-sm text-slate-300">No slots configured for this date yet.</p>
              ) : (
                sortedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2"
                  >
                    <p className="text-sm font-semibold">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </p>
                    <p className="text-xs font-semibold text-slate-300">Status: {slot.status}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
