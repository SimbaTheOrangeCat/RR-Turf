export function getRazorpayServerKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_SECRET and a key id (RAZORPAY_KEY_ID or NEXT_PUBLIC_RAZORPAY_KEY_ID).");
  }
  return { keyId, keySecret };
}

export function getRazorpayPublicKeyId() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID (or RAZORPAY_KEY_ID).");
  }
  return keyId;
}

export function getRazorpayWebhookSecret() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing RAZORPAY_WEBHOOK_SECRET.");
  }
  return secret;
}
