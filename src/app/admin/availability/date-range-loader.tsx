"use client";

import { useState } from "react";

type DateRangeLoaderProps = {
  initialStartDate: string;
  initialEndDate: string;
  minDate: string;
};

export default function DateRangeLoader({
  initialStartDate,
  initialEndDate,
  minDate,
}: DateRangeLoaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  function loadRange() {
    const params = new URLSearchParams();
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    window.location.href = `/admin/availability?${params.toString()}`;
  }

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
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-xl">
            <h3 className="text-xl font-bold">Load Slot Range</h3>
            <p className="mt-1 text-sm text-slate-300">Pick a start and end date to view slot availability.</p>

            <div className="mt-4 grid gap-3">
              <label className="text-sm text-slate-300">
                Start Date
                <input
                  type="date"
                  value={startDate}
                  min={minDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm outline-none ring-emerald-300/60 focus:ring"
                />
              </label>
              <label className="text-sm text-slate-300">
                End Date
                <input
                  type="date"
                  value={endDate}
                  min={startDate || minDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm outline-none ring-emerald-300/60 focus:ring"
                />
              </label>
            </div>

            <p className="mt-3 text-xs text-emerald-200">
              Selected range: {startDate || "-"} to {endDate || "-"}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-emerald-300 hover:text-emerald-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={loadRange}
                disabled={!startDate || !endDate || endDate < startDate}
                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                View Slots
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
