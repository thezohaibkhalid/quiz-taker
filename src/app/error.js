"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream-50 p-6">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-2">⚠️</div>
        <h1 className="font-serif text-3xl text-ink-900">Something went wrong</h1>
        <p className="mt-2 muted">An unexpected error occurred. We&apos;ve logged it and will look into it.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-secondary">Go home</Link>
        </div>
      </div>
    </main>
  );
}
