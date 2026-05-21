"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "" });
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return router.replace("/login");
        setUser(d.user);
        setName(d.user.name);
        setAvatarUrl(d.user.avatar_url || "");
      });
  }, [router]);

  async function saveProfile(e) {
    e.preventDefault();
    const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, avatar_url: avatarUrl }) });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Profile saved");
    setUser(d.user);
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!pwd.current || !pwd.next) return toast.error("Fill both passwords");
    const r = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_password: pwd.current, new_password: pwd.next }) });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Password updated");
    setPwd({ current: "", next: "" });
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "avatar");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Upload failed");
      setAvatarUrl(d.url);
      // Save right away
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar_url: d.url }) });
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!user) return null;

  return (
    <DashboardShell role={user.role}>
      <PageHeader title="My Profile" subtitle="Update your name, avatar and password." />

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.form
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={saveProfile}
          className="card lg:col-span-2 space-y-4"
        >
          <h2 className="section-title">Personal information</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-sm" disabled={uploading}>
                {uploading ? "Uploading…" : "Change avatar"}
              </button>
              <p className="text-xs muted mt-1">PNG/JPG up to 10MB</p>
            </div>
          </div>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email (read-only)</label>
            <input className="input bg-cream-50" value={user.email} disabled />
          </div>
          <div>
            <label className="label">Role</label>
            <span className="badge-blue capitalize">{user.role}</span>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </motion.form>

        <motion.form
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onSubmit={changePassword}
          className="card space-y-4"
        >
          <h2 className="section-title">Change password</h2>
          <div>
            <label className="label">Current password</label>
            <input type="password" className="input" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} required />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" className="input" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} minLength={8} required />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary">Update password</button>
          </div>
        </motion.form>
      </div>
    </DashboardShell>
  );
}
