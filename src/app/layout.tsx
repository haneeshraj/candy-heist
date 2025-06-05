import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.scss";
import Navbar from "@/components/Navbar/Navbar";
import SmoothScroller from "@/components/SmoothScroll/SmoothScroll";

export const metadata: Metadata = {
  title: "Candy Heist",
  description: "A Next.js application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <Toaster closeButton position="bottom-right" theme="dark" richColors />
        <SmoothScroller>{children}</SmoothScroller>
      </body>
    </html>
  );
}
