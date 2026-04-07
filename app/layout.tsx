import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fishing Travel Planner",
  description: "Premium world atlas for planning and documenting fishing expeditions."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#051007",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-abyss-950 font-body text-white antialiased">
        {children}
      </body>
    </html>
  );
}
