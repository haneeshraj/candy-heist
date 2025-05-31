import type { Metadata } from "next";

import styles from "./styles.module.scss";
import LetterAnimation from "@/components/LetterAnimation/LetterAnimation";
import WordAnimation from "@/components/WordAnimation/WordAnimation";
import Form from "@/components/Form/Form";

export const metadata: Metadata = {
  title: "Candy Heist",
  description: "A Next.js application",
};

const Contact = () => {
  return (
    <main className={styles["main"]}>
      <div className={styles["header"]}>
        <LetterAnimation
          text="CONTACT"
          element="h1"
          className={styles["heading"]}
        />
        <WordAnimation
          text="Lorem ipsum dolor sit amet consectetur adipisicing elit."
          element="p"
          className={styles["subheading"]}
        />
      </div>
      <div className={styles["content"]}>
        <Form />
      </div>
    </main>
  );
};

export default Contact;
