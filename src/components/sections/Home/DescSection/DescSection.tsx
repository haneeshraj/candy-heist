"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./styles.module.scss";

const DescSection = () => {
  const text =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLElement>(null);

  const splitLetters = (word: string) => {
    const letters: React.ReactNode[] = [];
    word.split("").forEach((letter, index) => {
      letters.push(
        <span
          key={letter + "_" + index}
          ref={(el) => {
            letterRefs.current.push(el);
          }}
          className={styles["letter"]}
        >
          {letter}
        </span>
      );
    });
    return letters;
  };

  const splitWords = (text: string) => {
    const words: React.ReactNode[] = [];

    text.split(" ").forEach((word, index) => {
      words.push(
        <span key={word + "_" + index} className={styles["word"]}>
          {splitLetters(word)}
        </span>
      );
    });
    return words;
  };

  const createAnimation = () => {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Set opacity of letters to 1 immediately on mobile
      letterRefs.current.forEach((letter) => {
        if (letter) {
          letter.style.opacity = "1";
        }
      });

      return; // Exit early, don't run animations on mobile
    }

    gsap.to(letterRefs.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        scrub: true,
        start: "top-=50% top",
        end: `+=${window.innerHeight / 1.54}`,
      },
      opacity: 1,
      ease: "none",
      stagger: 0.1,
    });
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    createAnimation();
  });

  return (
    <section className={styles["desc"]} ref={containerRef}>
      <div className={styles["desc__container"]}>{splitWords(text)}</div>
    </section>
  );
};

export default DescSection;
