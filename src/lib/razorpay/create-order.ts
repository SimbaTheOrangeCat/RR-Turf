type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
};

export async function createRazorpayOrder(amountPaise: number, receipt: string, keyId: string, keySecret: string) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      payment_capture: 1,
    }),
  });

  const data = (await response.json()) as RazorpayOrderResponse & { error?: { description?: string } };
  if (!response.ok) {
    throw new Error(data.error?.description ?? `Razorpay order failed (${response.status})`);
  }
  return data;
}
