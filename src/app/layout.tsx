import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RaysFit – Wearable Intelligence & Benchmarking Platform",
  description:
    "Discover RaysFit, a wearable intelligence and benchmarking platform for education, sports and wellness organisations. Connect devices, monitor participation and measure programme progress.",
  keywords: [
    "RaysFit",
    "Wearable Intelligence",
    "Benchmarking Platform",
    "Student Wellness",
    "Sports Performance",
    "Wearable Telemetry",
    "Smartband Integration",
    "Rays Sports Network",
  ],
  authors: [{ name: "Rays Sports Network Inc." }],
  openGraph: {
    title: "RaysFit – Wearable Intelligence & Benchmarking Platform",
    description:
      "One platform. Your benchmarks. Measurable progress. Connect wearable devices, establish meaningful benchmarks, monitor participation and measure progress.",
    url: "https://raysfit.io",
    siteName: "RaysFit",
    type: "website",
  },
  icons: {
    icon: "/brand/png/raysfit-icon-180.png",
    shortcut: "/brand/png/raysfit-icon-32.png",
    apple: "/brand/png/raysfit-icon-180.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('raysfit_theme') || localStorage.getItem('rayfit_theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors`}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
