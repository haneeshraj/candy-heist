"use client";

import LetterAnimation from "../LetterAnimation/LetterAnimation";

import styles from "./styles.module.scss";

const Footer = () => {
  return (
    <footer className={styles["footer"]}>
      <div className={styles["footer__logo"]}></div>
      <div className={styles["footer__contact"]}></div>
      <div className={styles["footer__nav"]}></div>
      <div className={styles["footer__socials"]}></div>
      <div className={styles["footer__copyright"]}></div>
    </footer>
  );
};

export default Footer;
