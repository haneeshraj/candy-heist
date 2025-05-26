"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./styles.module.scss";

const Footer = () => {
  gsap.registerPlugin(ScrollTrigger);
  return <div className={styles["footer-container"]}>Footer</div>;
};

export default Footer;
