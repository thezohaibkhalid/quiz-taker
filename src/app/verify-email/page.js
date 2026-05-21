"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState({ loading: true, ok: false, msg: "" });

  useEffect(() => {
    if (!token) {
      setState({ loading: false, ok: false, msg: "Missing token" });
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setState({ loading: false, ok: !!d.ok, msg: d.message || d.error || "" }));
  }, [token]);

  if (state.loading) return <p className="muted">Verifying…</p>;
  return state.ok ? (
    <div className="card text-center">
      <div className="text-4xl mb-2">✅</div>
      <p className="text-ink-800">{state.msg}</p>
      <Link href="/login" className="btn-primary mt-5 inline-flex">Sign in</Link>
    </div>
  ) : (
    <div className="card text-center">
      <div className="text-4xl mb-2">⚠️</div>
      <p className="text-red-600">{state.msg}</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Email Verification" subtitle="Confirming your email address…">
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <VerifyInner />
      </Suspense>
    </AuthShell>
  );
}
