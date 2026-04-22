import { NextResponse } from "next/server";
import { getRazorpayServerKeys } from "@/lib/payments/razorpay-env";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay/verify-signature";
import { createClient } from "@/lib/supabase/server";

type VerifyBody = {
  sessionId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = String(body.sessionId ?? "").trim();
  const orderId = String(body.razorpay_order_id ?? "").trim();
  const paymentId = String(body.razorpay_payment_id ?? "").trim();
  const signature = String(body.razorpay_signature ?? "").trim();

  if (!sessionId || !orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  let keySecret: string;
  try {
    ({ keySecret } = getRazorpayServerKeys());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payments not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature, keySecret)) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("payment_sessions")
    .select("id, user_id, razorpay_order_id, status, booking_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Payment session not found" }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (session.razorpay_order_id !== orderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  if (session.status === "paid" && session.booking_id) {
    return NextResponse.json({ bookingId: session.booking_id, alreadyFinalized: true });
  }

  const { data: bookingId, error: rpcError } = await supabase.rpc("finalize_booking_payment_session", {
    p_session_id: sessionId,
    p_razorpay_order_id: orderId,
    p_razorpay_payment_id: paymentId,
  });

  if (rpcError) {
    const msg = rpcError.message ?? "Could not complete booking";
    const lower = msg.toLowerCase();
    if (lower.includes("expired")) {
      return NextResponse.json({ error: msg }, { status: 410 });
    }
    if (lower.includes("not available") || lower.includes("already booked")) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ bookingId });
}
