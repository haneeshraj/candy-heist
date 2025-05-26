"use client";

import { JSX, useRef } from "react";
import { motion, useInView } from "motion/react";

interface LetterAnimationProps {
  element?: "div" | "span" | "h1" | "h2" | "h3" | "p" | "h4" | "h5" | "h6";
  text: string;
  letterDelay?: number;
  delayOffset?: number;
  duration?: number;
  ease?: [number, number, number, number];
  className?: string;
}

function LetterAnimation({
  element = "div",
  text,
  letterDelay = 0.1,
  delayOffset = 0,
  duration = 0.8,
  ease = [0.5, 0, 0, 1],
  className,
  ...props
}: LetterAnimationProps): JSX.Element {
  const Component = element;

  const letters = text.split("");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <Component {...props} className={className} ref={ref}>
      {letters.map((letter, index) => (
        <span
          key={index}
          style={{ display: "inline-block", overflow: "hidden" }}
        >
          <motion.span
            initial={{ y: "100%" }}
            animate={isInView ? { y: 0 } : { y: "100%" }}
            transition={{
              delay: delayOffset + index * letterDelay,
              duration: duration,
              ease: ease,
            }}
            style={{ display: "inline-block" }}
          >
            {letter}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}

export default LetterAnimation;
