import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReloadThrottle } from "@/features/panel/components/reload-throttle";
import { ToastProvider } from "@/components/toast";
import { FrontendErrorReporter } from "@/features/panel/components/frontend-error-reporter";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Trava o zoom em 1x — evita o auto-zoom do iOS Safari ao focar em inputs
// com fonte menor que 16px.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Baderna | Ser bandido is good as fuck",
  description: "A premium gaming community and stat tracking platform.",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased">
        <ReloadThrottle />
        <FrontendErrorReporter />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
