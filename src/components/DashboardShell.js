"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import NotificationsBell from "./NotificationsBell";

const ROLE_NAV = {
  student: [
    { href: "/student/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/student/quizzes", label: "My Quizzes", icon: "📝" },
    { href: "/student/results", label: "Results", icon: "📊" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ],
  teacher: [
    { href: "/teacher/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/teacher/quizzes", label: "My Quizzes", icon: "📝" },
    { href: "/teacher/subjects", label: "Subjects", icon: "📚" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Overview", icon: "🏠" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/subjects", label: "Subjects", icon: "📚" },
    { href: "/admin/logs", label: "Audit Logs", icon: "📜" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ],
};

export default function DashboardShell({ children, role }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) router.replace("/login");
        else setUser(d.user);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.replace("/login");
  }

  const nav = ROLE_NAV[role] || [];
  const roleColor = role === "teacher" ? "accent" : role === "admin" ? "ink" : "brand";

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-ink-100 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white font-bold">Q</div>
          <span className="font-semibold">Quiz System</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <button className="btn-ghost" onClick={() => setOpen(true)}>☰</button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex w-64 shrink-0 border-r border-ink-100 bg-white flex-col min-h-screen sticky top-0">
          <SidebarBody user={user} nav={nav} pathname={pathname} roleColor={roleColor} onLogout={logout} />
        </aside>

        {/* Sidebar (mobile drawer) */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="md:hidden fixed inset-0 bg-ink-900/40 z-40" />
              <motion.aside
                initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-ink-100 z-50 flex flex-col"
              >
                <SidebarBody user={user} nav={nav} pathname={pathname} roleColor={roleColor} onLogout={logout} onClickItem={() => setOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {user && !user.is_verified && <VerifyBanner email={user.email} />}
          <div className="hidden md:flex items-center justify-end gap-2 px-6 lg:px-10 pt-5">
            <NotificationsBell />
          </div>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 md:px-10 md:pt-2 md:pb-10 max-w-6xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function VerifyBanner({ email }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  async function resend() {
    setSending(true);
    try {
      const r = await fetch("/api/auth/resend-verification", { method: "POST" });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Failed");
      setSent(true);
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(err.message);
    } finally { setSending(false); }
  }
  return (
    <div className="bg-accent-50 border-b border-accent-200 px-6 py-2.5 text-sm text-accent-800 flex items-center justify-between flex-wrap gap-3">
      <span>⚠️ Please verify your email <b>{email}</b> to unlock all features.</span>
      <button onClick={resend} disabled={sending || sent} className="btn-accent text-xs py-1 px-3">
        {sent ? "Sent ✓" : sending ? "Sending…" : "Resend verification email"}
      </button>
    </div>
  );
}

function SidebarBody({ user, nav, pathname, roleColor, onLogout, onClickItem }) {
  return (
    <>
      <div className="p-5 border-b border-ink-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white font-bold">Q</div>
          <div>
            <p className="font-semibold text-ink-900 text-sm leading-tight">Quiz System</p>
            <p className="text-xs muted capitalize">{user?.role || "—"}</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClickItem}
              className={`nav-link ${active ? "nav-link-active" : ""}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-ink-100">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-ink-900 truncate">{user.name}</p>
            <p className="text-xs muted truncate">{user.email}</p>
          </div>
        )}
        <button onClick={onLogout} className="btn-ghost w-full justify-start text-red-600 hover:bg-red-50">
          <span>↩</span> Sign out
        </button>
      </div>
    </>
  );
}
