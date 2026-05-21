"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import { fadeUp, stagger } from "@/components/Motion";
import Pagination from "@/components/Pagination";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });

  function load() {
    const q = new URLSearchParams();
    if (query) q.set("q", query);
    if (roleFilter) q.set("role", roleFilter);
    q.set("page", String(page));
    q.set("limit", "20");
    fetch(`/api/users?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setPages(d.pages || 1);
        setTotal(d.total || 0);
      });
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [query, roleFilter, page]);
  useEffect(() => { setPage(1); }, [query, roleFilter]);

  async function updateUser(id, patch) {
    const r = await fetch(`/api/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Updated");
    load();
  }

  async function deleteUser(id) {
    if (!confirm("Permanently delete this user?")) return;
    const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Deleted");
    load();
  }

  async function createUser(e) {
    e.preventDefault();
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("User created");
    setForm({ name: "", email: "", password: "", role: "student" });
    setShowForm(false);
    load();
  }

  return (
    <DashboardShell role="admin">
      <PageHeader
        title="User Management"
        subtitle={`${total} user${total === 1 ? "" : "s"} · create, deactivate or change roles.`}
        right={<button onClick={() => setShowForm((s) => !s)} className="btn-primary">{showForm ? "Close" : "+ Add User"}</button>}
      />

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} onSubmit={createUser} className="card mb-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Password (min 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn-primary">Create</button>
        </motion.form>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input max-w-xs" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-xs muted uppercase tracking-wider text-left">
            <tr>
              <th className="px-5 py-2">User</th>
              <th className="px-5 py-2">Role</th>
              <th className="px-5 py-2">Verified</th>
              <th className="px-5 py-2">Active</th>
              <th className="px-5 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-cream-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/users/${u._id}`} className="font-medium text-ink-900 hover:text-brand-700">{u.name}</Link>
                  <p className="text-xs muted">{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <select value={u.role} onChange={(e) => updateUser(u._id, { role: e.target.value })} className="input py-1 text-xs">
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-5 py-3">{u.is_verified ? <span className="badge-green">Verified</span> : <button className="badge-gray" onClick={() => updateUser(u._id, { is_verified: true })}>Verify</button>}</td>
                <td className="px-5 py-3">
                  <button onClick={() => updateUser(u._id, { is_active: !u.is_active })} className={u.is_active ? "badge-green" : "badge-red"}>
                    {u.is_active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <Link href={`/admin/users/${u._id}`} className="btn-ghost text-brand-700 text-xs">View</Link>
                    <button onClick={() => deleteUser(u._id)} className="btn-ghost text-red-600 text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <Pagination page={page} pages={pages} onChange={setPage} />
    </DashboardShell>
  );
}
