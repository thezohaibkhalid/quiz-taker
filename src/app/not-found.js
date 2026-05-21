import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream-50 p-6">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-2">404</div>
        <h1 className="font-serif text-3xl text-ink-900">Page not found</h1>
        <p className="mt-2 muted">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">Back to home</Link>
      </div>
    </main>
  );
}
