"use client";

import styles from "./styles.module.scss";
import { motion, useInView } from "motion/react";
import { createWordVariants } from "./anim";
import { useRef } from "react";
type AnimateTextProps = {
  type?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  children: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number; // Initial delay before animation starts
  wordDelay?: number; // Delay between each word
  once?: boolean; // Whether to only animate once when it enters view
};

export const AnimateLetters = ({
  type = "div",
  children,
  className,
  style,
  delay = 0, // Default initial delay is 0
  wordDelay = 0.1, // Default word delay is 0.1 seconds
  once = true, // Default to only animate once
}: AnimateTextProps) => {
  const Component = type;
  const words = children.split("");

  const ref = useRef(null);
  const isInView = useInView(ref, { once });

  // Create variants with the specified delays
  const variants = createWordVariants(delay, wordDelay);

  return (
    <Component
      ref={ref}
      className={`${styles.animateText} ${className || ""}`}
      style={style}
    >
      {words.map((word, index) => {
        return (
          <span className={styles["overflow"]} key={index}>
            <motion.span
              variants={variants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              custom={index}
              className={styles["word"]}
            >
              {word}
              {word === " " ? "\u00A0" : ""}
            </motion.span>
          </span>
        );
      })}
    </Component>
  );
};
