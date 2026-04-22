import { customerNameBookingError, phoneBookingError } from "@/lib/booking/contact-validation";

export type BookingPaymentPayload = {
  slotId: string;
  customerName: string;
  phone: string;
  contactEmail: string;
  wantsFood: boolean;
  foodItems: string[];
};

export function validateBookingPaymentPayload(input: unknown): { ok: true; value: BookingPaymentPayload } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid JSON body" };
  }
  const body = input as Record<string, unknown>;
  const slotId = String(body.slotId ?? "").trim();
  const customerName = String(body.customerName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const contactEmail = String(body.contactEmail ?? "").trim();
  const wantsFood = body.wantsFood === true || body.wantsFood === "yes";
  const foodItemsRaw = body.foodItems;
  const foodItems = Array.isArray(foodItemsRaw)
    ? foodItemsRaw.map((item) => String(item)).filter(Boolean)
    : [];

  if (!slotId) {
    return { ok: false, error: "Slot is required" };
  }
  const nameErr = customerNameBookingError(customerName);
  if (nameErr) {
    return { ok: false, error: nameErr };
  }
  const phoneErr = phoneBookingError(phone);
  if (phoneErr) {
    return { ok: false, error: phoneErr };
  }
  if (wantsFood && foodItems.length === 0) {
    return { ok: false, error: "Please select at least one food item or choose No for food preference" };
  }

  return {
    ok: true,
    value: {
      slotId,
      customerName,
      phone,
      contactEmail,
      wantsFood,
      foodItems: wantsFood ? foodItems : [],
    },
  };
}
