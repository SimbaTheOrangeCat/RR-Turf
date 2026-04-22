"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTime } from "@/lib/booking/utils";

const FOOD_MENU_ITEMS = [
  "Maggi",
  "Sandwich",
  "Chineese Omlette",
  "Poach",
  "Cheese maggi",
  "Chicken maggi",
];

type SlotOption = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
};

type ProgressiveBookingWizardProps = {
  selectedDate: string;
  minDate: string;
  slots: SlotOption[];
  action: (formData: FormData) => void | Promise<void>;
};

export default function ProgressiveBookingWizard({
  selectedDate,
  minDate,
  slots,
  action,
}: ProgressiveBookingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [dateInput, setDateInput] = useState(selectedDate);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [foodPreference, setFoodPreference] = useState<"yes" | "no">("no");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    setDateInput(selectedDate);
    setStep(1);
    setSelectedSlotId("");
    setFoodPreference("no");
    setPaymentConfirmed(false);
  }, [selectedDate]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId),
    [slots, selectedSlotId],
  );
  const slotAvailable = selectedSlot?.status === "available";

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className={`rounded-full px-3 py-1 ${step >= 1 ? "bg-emerald-300/20 text-emerald-100" : "bg-white/10 text-slate-300"}`}>
          1. Pick Date
        </span>
        <span className={`rounded-full px-3 py-1 ${step >= 2 ? "bg-emerald-300/20 text-emerald-100" : "bg-white/10 text-slate-300"}`}>
          2. Select Time
        </span>
        <span className={`rounded-full px-3 py-1 ${step >= 3 ? "bg-emerald-300/20 text-emerald-100" : "bg-white/10 text-slate-300"}`}>
          3. Enter Details
        </span>
        <span className={`rounded-full px-3 py-1 ${step >= 4 ? "bg-emerald-300/20 text-emerald-100" : "bg-white/10 text-slate-300"}`}>
          4. Payment
        </span>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">Pick a date to continue booking.</p>
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              name="date"
              value={dateInput}
              min={minDate}
              onChange={(event) => setDateInput(event.target.value)}
              className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Pick Date
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200"
            >
              Continue
            </button>
          </form>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">Select time slot you want to book for {selectedDate}.</p>
          {slots.length === 0 ? (
            <p className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100">
              Slots has not been setup by host yet for this date.
            </p>
          ) : null}
          <select
            value={selectedSlotId}
            onChange={(event) => setSelectedSlotId(event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
            disabled={slots.length === 0}
          >
            <option value="">Select a time slot</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
              </option>
            ))}
          </select>

          {selectedSlot ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                slotAvailable
                  ? "border border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                  : "border border-red-400/40 bg-red-400/10 text-red-200"
              }`}
            >
              {slotAvailable
                ? "Slot is available. You can continue."
                : `Slot is ${selectedSlot.status}. Please choose another slot.`}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!slotAvailable || slots.length === 0}
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {(step === 3 || step === 4) && selectedSlot ? (
        <form action={action} className="space-y-3">
          <input type="hidden" name="slotId" value={selectedSlot.id} />
          <input type="hidden" name="date" value={selectedDate} />

          {/* Keep detail fields mounted on step 4 so server action still receives name/phone/email/food */}
          <div className={step === 4 ? "hidden" : "space-y-3"}>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-300">Name *</label>
              <input
                name="customerName"
                required
                className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-300">Phone Number *</label>
              <input
                name="phone"
                type="tel"
                required
                className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-slate-300">Email (optional)</label>
              <input
                name="contactEmail"
                type="email"
                className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
              <p className="text-xs font-semibold text-slate-300">Food preference</p>
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
              <div className={`mt-3 rounded-lg border border-white/10 bg-slate-900/70 p-3 ${foodPreference === "yes" ? "" : "opacity-60"}`}>
                <p className="text-xs font-semibold text-emerald-200">Menu</p>
                <div className="mt-2 grid gap-2">
                  {FOOD_MENU_ITEMS.map((item) => (
                    <label key={`${selectedSlot.id}-${item}`} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="foodItems"
                        value={item}
                        disabled={foodPreference !== "yes"}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Continue to Payment
              </button>
            </div>
          </div>

          {step === 4 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                You selected {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)} on{" "}
                {selectedDate}.
              </p>
              <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3">
                <p className="text-xs font-semibold text-amber-100">
                  Pay INR 200 advance (non-refundable) to guarantee this slot.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value="INR 200 (Non-refundable advance)"
                    readOnly
                    className="w-full rounded-lg border border-amber-300/40 bg-slate-950 px-3 py-2 text-sm text-amber-100"
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentConfirmed(true)}
                    className="rounded-lg border border-amber-300/50 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200"
                  >
                    Pay
                  </button>
                </div>
                <p className="mt-2 text-xs text-amber-100">
                  {paymentConfirmed ? "Payment step marked complete." : "Click Pay to continue."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!paymentConfirmed}
                  className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
