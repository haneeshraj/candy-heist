import type { Metadata } from "next";

import styles from "./styles.module.scss";
import Footer from "@/components/Footer/Footer";

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
        <div className={styles["container"]}>
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
