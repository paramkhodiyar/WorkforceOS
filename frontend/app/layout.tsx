import type { Metadata } from "next";
import { AuthProvider } from "../lib/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkforceOS Management Platform",
  description: "Enterprise workforce management and operations system",
  icons: {
    icon: "/workforceoslogo.png",
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
