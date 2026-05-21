"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import AuthShell from "@/components/AuthShell";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Failed");
      toast.success("Password updated. Please sign in.");
      router.push("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="text-red-600 text-sm">Missing reset token. Please use the link from your email.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">New password</label>
        <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </div>
      <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>{loading ? "Updating…" : "Reset password"}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="Choose a new password at least 8 characters long." footer={<Link href="/login" className="link-brand">Back to sign in</Link>}>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <ResetPasswordInner />
      </Suspense>
    </AuthShell>
  );
}
