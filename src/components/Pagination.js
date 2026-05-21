"use client";

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(pages, page + 1));
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="muted">Page {page} of {pages}</p>
      <div className="flex gap-2">
        <button onClick={prev} disabled={page <= 1} className="btn-secondary text-xs">← Prev</button>
        <button onClick={next} disabled={page >= pages} className="btn-secondary text-xs">Next →</button>
      </div>
    </div>
  );
}
