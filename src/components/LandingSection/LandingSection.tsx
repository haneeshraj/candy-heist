"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import styles from "./styles.module.scss";

const LandingSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "30%"]);

  return (
    <div className={styles["landing"]} ref={ref}>
      <motion.video
        className={styles["video"]}
        autoPlay
        loop
        muted
        playsInline
        style={{ y }}
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </motion.video>
    </div>
  );
};

export default LandingSection;
