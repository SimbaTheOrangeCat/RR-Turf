import { NextResponse } from "next/server";
import { getRazorpayWebhookSecret } from "@/lib/payments/razorpay-env";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay/verify-signature";
import { createServiceRoleClient } from "@/lib/supabase/service";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  let secret: string;
  try {
    secret = getRazorpayWebhookSecret();
  } catch {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let parsed: RazorpayWebhookPayload;
  try {
    parsed = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = parsed.event ?? "";
  const payEntity = parsed.payload?.payment?.entity;
  const orderId = payEntity?.order_id;
  const paymentId = payEntity?.id;

  if (!orderId || !paymentId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createServiceRoleClient();

  if (event === "payment.captured") {
    const { data: bookingId, error } = await supabase.rpc("finalize_booking_by_order_webhook", {
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, bookingId });
  }

  if (event === "payment.failed") {
    await supabase
      .from("payment_sessions")
      .update({ status: "failed" })
      .eq("razorpay_order_id", orderId)
      .eq("status", "created");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
