"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  async function load() {
    try {
      const r = await fetch("/api/notifications");
      const d = await r.json();
      if (d.ok) { setItems(d.items); setUnread(d.unread); }
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markRead() {
    await fetch("/api/notifications", { method: "POST" });
    setUnread(0);
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open && unread > 0) markRead(); }}
        className="relative w-9 h-9 rounded-lg border border-ink-200 bg-white hover:bg-cream-100 flex items-center justify-center"
        aria-label="Notifications"
      >
        <span>🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute right-0 mt-2 w-80 bg-white border border-ink-100 rounded-xl shadow-card z-30 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
              <p className="font-semibold text-sm">Notifications</p>
              {items.length > 0 && <button onClick={markRead} className="text-xs link-brand">Mark all read</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-6 text-sm muted text-center">No notifications yet.</p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {items.map((n) => (
                    <li key={n._id} className={`px-4 py-3 ${n.is_read ? "" : "bg-brand-50/40"}`}>
                      <p className="font-medium text-sm text-ink-900">{n.title}</p>
                      {n.message && <p className="text-xs muted mt-0.5">{n.message}</p>}
                      <p className="text-[11px] text-ink-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
