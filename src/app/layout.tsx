import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notes",
  description: "A simple, fast note-taking app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Notes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-white antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
