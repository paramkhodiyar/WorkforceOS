import type { Metadata } from "next";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { ToastProvider } from "../lib/toast/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkforceOS | Next-Gen Enterprise HRMS & Operations Platform",
  description: "WorkforceOS is the ultimate Human Resource Management System (HRMS) for modern teams. Streamline shift attendance, double-approval leaves, task state machines, composite performance reviews, and automated payroll with PF, ESIC, and PT calculations.",
  keywords: [
    "HRMS",
    "HRMS Software",
    "Human Resource Management System",
    "Workforce Operating System",
    "Attendance Tracker",
    "Shift Management",
    "Leave Double-Approval",
    "Performance Review Scorecard",
    "Automated Payroll",
    "Statutory Deductions",
    "PF ESIC Calculations",
    "Professional Tax Software",
    "Task State Machine"
  ].join(", "),
  openGraph: {
    title: "WorkforceOS | Next-Gen Enterprise HRMS & Operations Platform",
    description: "Streamline human resources, shift attendance, leaves, performance scorecard, and statutory payroll in a single unified platform.",
    url: "https://workforceos.com",
    siteName: "WorkforceOS",
    images: [
      {
        url: "/workforceoslogo.png",
        width: 800,
        height: 800,
        alt: "WorkforceOS Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@400;500&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
