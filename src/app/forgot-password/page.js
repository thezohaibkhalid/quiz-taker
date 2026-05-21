"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import AuthShell from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Failed");
      setSent(true);
      toast.success("If that account exists, a reset link was sent.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send a reset link."
      footer={<Link href="/login" className="link-brand">Back to sign in</Link>}
    >
      {sent ? (
        <div className="card text-center">
          <div className="text-4xl mb-2">📬</div>
          <p className="text-ink-700">If that email is registered, a password reset link has been sent. Check your inbox.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
    </AuthShell>
  );
}
