import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

export function apiError(err, status = 500) {
  // eslint-disable-next-line no-console
  console.error("[api-error]", err);
  const message = isProd ? "Something went wrong. Please try again." : err?.message || String(err);
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function tooManyRequests(retryAfterMs = 60_000) {
  return NextResponse.json(
    { ok: false, error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
  );
}
