"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import styles from "./Landing.module.scss";
import { AnimateLetters } from "@/components/AnimateLetters/AnimateLetters";

const Landing: React.FC = () => {
  const { scrollY } = useScroll();

  // Create scale transform value for parallax effect
  const scaleValue = useTransform(scrollY, [0, 1000], [1, 2]); // Start at normal scale, zoom to 1.3x

  return (
    <div className={styles.landing}>
      <motion.div className={styles.videoWrapper} style={{ scale: scaleValue }}>
        <video
          className={styles.video}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/Website Background.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <div className={styles.content}>
        <AnimateLetters className={styles["content__heading"]}>
          Candy Heist
        </AnimateLetters>
      </div>
    </div>
  );
};

export default Landing;
