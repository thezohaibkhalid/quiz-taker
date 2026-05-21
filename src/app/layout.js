import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: {
    default: "TUF Quiz Management System",
    template: "%s · TUF Quiz System",
  },
  description: "Cloud-native online quiz platform — create, attempt, evaluate, and announce results in real time.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-50 text-ink-900">
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1a1813", color: "#fdfcf8", borderRadius: 10, fontSize: 14 },
            success: { iconTheme: { primary: "#2563eb", secondary: "#fdfcf8" } },
            error: { iconTheme: { primary: "#ea580c", secondary: "#fdfcf8" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
