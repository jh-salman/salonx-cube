import type { Metadata, Viewport } from "next";
import "./cube.css";

export const metadata: Metadata = {
  title: "SALON X — Cube",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SALON X — Cube",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
