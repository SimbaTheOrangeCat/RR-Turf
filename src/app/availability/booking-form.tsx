"use client";

import { useState } from "react";

const FOOD_MENU_ITEMS = [
  "Maggi",
  "Sandwich",
  "Chineese Omlette",
  "Poach",
  "Cheese maggi",
  "Chicken maggi",
];

type BookingFormProps = {
  slotId: string;
  date: string;
  action: (formData: FormData) => void | Promise<void>;
};

export default function BookingForm({ slotId, date, action }: BookingFormProps) {
  const [foodPreference, setFoodPreference] = useState<"yes" | "no">("no");
  const allowFoodSelection = foodPreference === "yes";

  return (
    <form action={action} className="mt-3 space-y-3 rounded-lg border border-white/10 bg-slate-900/60 p-3">
      <input type="hidden" name="slotId" value={slotId} />
      <input type="hidden" name="date" value={date} />

      <div className="grid gap-2">
        <label htmlFor={`name-${slotId}`} className="text-xs font-semibold text-slate-300">
          Name *
        </label>
        <input
          id={`name-${slotId}`}
          name="customerName"
          required
          className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm outline-none ring-emerald-300/60 focus:ring"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor={`phone-${slotId}`} className="text-xs font-semibold text-slate-300">
          Phone Number *
        </label>
        <input
          id={`phone-${slotId}`}
          name="phone"
          type="tel"
          required
          className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm outline-none ring-emerald-300/60 focus:ring"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor={`email-${slotId}`} className="text-xs font-semibold text-slate-300">
          Email (optional)
        </label>
        <input
          id={`email-${slotId}`}
          name="contactEmail"
          type="email"
          className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm outline-none ring-emerald-300/60 focus:ring"
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
        <p className="text-xs font-semibold text-slate-300">Want to pre-book food?</p>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="foodPreference"
              value="yes"
              checked={foodPreference === "yes"}
              onChange={() => setFoodPreference("yes")}
            />
            Yes
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="foodPreference"
              value="no"
              checked={foodPreference === "no"}
              onChange={() => setFoodPreference("no")}
            />
            No
          </label>
        </div>

        <div className={`mt-3 rounded-lg border border-white/10 bg-slate-900/70 p-3 ${allowFoodSelection ? "" : "opacity-60"}`}>
          <p className="text-xs font-semibold text-emerald-200">Menu selection</p>
          <div className="mt-2 grid gap-2">
            {FOOD_MENU_ITEMS.map((item) => (
              <label key={`${slotId}-${item}`} className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="foodItems" value={item} disabled={!allowFoodSelection} />
                {item}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3">
        <label className="text-xs font-semibold text-amber-100">Make a payment of 200 advance non refundable</label>
        <div className="mt-2 flex items-center gap-2">
          <input
            value="INR 200 (Non-refundable advance)"
            readOnly
            className="w-full rounded-lg border border-amber-300/40 bg-slate-950 px-3 py-2 text-sm text-amber-100"
          />
          <button
            type="button"
            className="rounded-lg border border-amber-300/50 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200"
          >
            Pay
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        Book Slot
      </button>
    </form>
  );
}
