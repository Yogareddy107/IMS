import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "IntraSphere Labs – IMS (Internship Management System)",
    template: "%s | IntraSphere Labs IMS",
  },
  description:
    "Building Real-World Products Through Innovation. Centralized talent workspace for managing cohort onboarding, task deliverables, attendance check-ins, offer letters, documents, and performance evaluations.",
  keywords: [
    "IntraSphere Labs",
    "Internship Management System",
    "IMS",
    "Cohort Management",
    "Intern Onboarding",
    "Post-Selection Management",
    "Talent Platform",
  ],
  authors: [{ name: "IntraSphere Labs" }],
  creator: "IntraSphere Labs",
  publisher: "IntraSphere Labs",
  metadataBase: new URL("https://intraspherelabs.com"),
  openGraph: {
    title: "IntraSphere Labs – IMS (Internship Management System)",
    description:
      "Centralized workspace for cohort onboarding, tasks, deliverables, check-ins, and performance.",
    url: "https://intraspherelabs.com",
    siteName: "IntraSphere Labs IMS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntraSphere Labs – IMS",
    description: "Building Real-World Products Through Innovation.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#111111]">{children}</body>
    </html>
  );
}
