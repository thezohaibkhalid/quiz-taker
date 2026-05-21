/**
 * Lightweight in-memory rate limiter (per-process).
 * Good enough for single-instance staging / small deployments.
 * For multi-replica production, swap this with Redis-backed.
 */

const buckets = global.__rate_buckets || new Map();
global.__rate_buckets = buckets;

export function rateLimit({ key, max = 10, windowMs = 60_000 }) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: max - 1, reset: now + windowMs };
  }
  if (entry.count >= max) {
    return { ok: false, remaining: 0, reset: entry.reset, retryAfterMs: entry.reset - now };
  }
  entry.count += 1;
  return { ok: true, remaining: max - entry.count, reset: entry.reset };
}

export function ipKey(req, suffix = "") {
  const fwd = req.headers.get?.("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get?.("x-real-ip") || "anon";
  return `${ip}:${suffix}`;
}

// Occasional cleanup of expired buckets so memory stays small.
if (!global.__rate_cleanup_timer) {
  global.__rate_cleanup_timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }, 60_000).unref?.();
}
