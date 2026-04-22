# Razorpay manual test matrix (test mode)

Use Razorpay Dashboard test keys and [test cards/UPI](https://razorpay.com/docs/payments/payments/test-card-details/). Apply `supabase/schema.sql` (or equivalent migration) so `payment_sessions` and RPCs exist before testing.

## Success path

1. Log in as a normal user, pick an available slot, complete details, tap **Pay with Razorpay**.
2. Complete checkout with a successful test payment.
3. Expect redirect to `/availability?date=…&success=…` and an active booking with `payment_status` **paid** in admin.

## User cancels / dismisses checkout

1. Open Pay, dismiss the Razorpay modal without paying.
2. Expect no booking; slot remains available; UI shows that the window was closed.

## Slot race (another user books first)

1. User A creates an order for a slot (do not pay yet).
2. User B books the same slot through another path if any exists, or an admin marks the slot unavailable.
3. User A completes payment and verify runs.
4. Expect verify to fail with a clear error (slot no longer available); Razorpay may still show success—handle support manually if money moved without booking (webhook + monitoring).

## Double verify / idempotency

1. Complete a successful payment once (booking created).
2. Replay the same verify payload (same `sessionId`, order id, payment id, signature) if you capture it from devtools.
3. Expect HTTP 200 and `alreadyFinalized: true` (or success without a second booking); only one active booking for that slot.

## Expired session

1. Create an order, wait until `expires_at` passes (or temporarily shorten TTL in code for a dev build), then pay in Razorpay (if still allowed) and call verify.
2. Expect verify to reject with session expired; no booking.

## Webhook (optional hardening)

1. Configure webhook URL to `https://<host>/api/payments/razorpay/webhook` with `RAZORPAY_WEBHOOK_SECRET` set.
2. Trigger `payment.captured` from Razorpay test tools or a real test payment.
3. Expect booking finalized if the client verify never ran (e.g. closed tab after pay).

## Rate limit

1. Rapidly call create-order more than eight times in one minute for the same user.
2. Expect HTTP 429 from create-order.
