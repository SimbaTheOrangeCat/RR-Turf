import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { validateBookingPaymentPayload } from "@/lib/payments/booking-payment-payload";
import { rateLimitUserAction } from "@/lib/payments/rate-limit";
import { getRazorpayPublicKeyId, getRazorpayServerKeys } from "@/lib/payments/razorpay-env";
import { createRazorpayOrder } from "@/lib/razorpay/create-order";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const ADVANCE_PAYMENT_PAISE = 20_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateBookingPaymentPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const payload = parsed.value;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!rateLimitUserAction(user.id, 8, 60_000)) {
    return NextResponse.json({ error: "Too many payment attempts. Try again in a minute." }, { status: 429 });
  }

  const { data: slot, error: slotError } = await supabase
    .from("time_slots")
    .select("id, status")
    .eq("id", payload.slotId)
    .maybeSingle();

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }
  if (slot.status !== "available") {
    return NextResponse.json({ error: "This slot is no longer available." }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("slot_id", payload.slotId)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "This slot is already booked." }, { status: 409 });
  }

  let keyId: string;
  let keySecret: string;
  let publicKeyId: string;
  try {
    ({ keyId, keySecret } = getRazorpayServerKeys());
    publicKeyId = getRazorpayPublicKeyId();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payments not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const sessionId = randomUUID();
  const receipt = `rr_${sessionId.replace(/-/g, "").slice(0, 20)}`;

  let order;
  try {
    order = await createRazorpayOrder(ADVANCE_PAYMENT_PAISE, receipt, keyId, keySecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create payment order";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  try {
    const svc = createServiceRoleClient();
    const { error: insertError } = await svc.from("payment_sessions").insert({
      id: sessionId,
      user_id: user.id,
      slot_id: payload.slotId,
      amount_paise: ADVANCE_PAYMENT_PAISE,
      currency: "INR",
      customer_name: payload.customerName,
      phone: payload.phone,
      contact_email: payload.contactEmail || null,
      food_items: payload.foodItems,
      razorpay_order_id: order.id,
      status: "created",
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server configuration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    sessionId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: publicKeyId,
  });
}
