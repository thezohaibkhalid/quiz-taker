import Link from "next/link";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="min-h-screen flex items-stretch bg-cream-50">
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-brand-800 text-white p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <span className="font-semibold">Quiz System</span>
        </Link>
        <div>
          <h2 className="font-serif text-4xl leading-tight">Run quizzes,<br/>evaluate instantly,<br/>announce results.</h2>
          <p className="mt-4 text-white/80 max-w-md text-sm leading-relaxed">A cloud-native platform for educators — built on Next.js, MongoDB Atlas, Cloudinary, and Gmail SMTP.</p>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} Online Quiz Management System</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="md:hidden inline-flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-semibold text-ink-900">Quiz System</span>
          </Link>
          <h1 className="font-serif text-3xl text-ink-900">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-600 text-sm">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-center text-ink-600">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
