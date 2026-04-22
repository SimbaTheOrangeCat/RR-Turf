const buckets = new Map<string, number[]>();

export function rateLimitUserAction(userId: string, maxPerWindow: number, windowMs: number) {
  const now = Date.now();
  const stamps = buckets.get(userId) ?? [];
  const fresh = stamps.filter((t) => now - t < windowMs);
  if (fresh.length >= maxPerWindow) {
    return false;
  }
  fresh.push(now);
  buckets.set(userId, fresh);
  return true;
}
