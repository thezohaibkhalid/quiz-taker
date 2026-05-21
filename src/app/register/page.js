"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthShell from "@/components/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Registration failed");
      toast.success("Account created — please check your email to verify.");
      router.push("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join as a student or teacher. Admins are managed by the system administrator."
      footer={<>Already have an account? <Link href="/login" className="link-brand font-medium">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Your name" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="label">I am a…</label>
          <div className="grid grid-cols-2 gap-2">
            {["student", "teacher"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => update("role", r)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium capitalize transition ${
                  form.role === r
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:bg-cream-100"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
