import type { Metadata } from "next";

import styles from "./styles.module.scss";
import LetterAnimation from "@/components/LetterAnimation/LetterAnimation";

export const metadata: Metadata = {
  title: "Candy Heist",
  description: "A Next.js application",
};

const Contact = () => {
  return (
    <main className={styles["main"]}>
      <LetterAnimation
        text="CONTACT"
        element="h1"
        className={styles["heading"]}
      />
    </main>
  );
};

export default Contact;
