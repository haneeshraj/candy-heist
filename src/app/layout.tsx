import type { Metadata } from "next";
import "./globals.scss";

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
      <body>{children}</body>
    </html>
  );
}
