import type { Metadata } from "next";
import { gellix } from "../fonts/fonts";
import "./globals.scss";
import { Navbar } from "@/components/Navbar/Navbar";
import SmoothScroller from "@/components/SmoothScroll/SmoothScroll";

export const metadata: Metadata = {
  title: "Candy Heist",
  description: "A sweet adventure game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={gellix.variable}>
      <body>
        <Navbar />
        <SmoothScroller>{children}</SmoothScroller>
      </body>
    </html>
  );
}
