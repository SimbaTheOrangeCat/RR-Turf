import { createHmac, timingSafeEqual } from "crypto";

export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const body = `${orderId}|${paymentId}`;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

export function verifyRazorpayWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signatureHeader, "utf8"));
  } catch {
    return false;
  }
}
