"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./styles.module.scss";

const InfoSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLHeadingElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  const addWordRef = (el: HTMLSpanElement) => {
    if (el && !wordsRef.current.includes(el)) {
      wordsRef.current.push(el);
    }
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Pin ScrollTrigger - starts when top of main hits top of viewport
    ScrollTrigger.create({
      trigger: questionRef.current,
      start: "top top",
      end: "bottom bottom-=10%",
      pin: containerRef.current,
      pinSpacing: false,
    });
    // Animation starts from the center of the container and all words come in from the bottom

    // Animation ScrollTrigger - starts when top of main hits center of viewport
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: questionRef.current,
        start: "top center-=5%",
        end: "bottom+=10% center+=10%",
        scrub: 1,
        pinSpacing: false,
      },
    });

    // Animation starts from the center of the container and all words come in from the bottom
    tl.fromTo(
      wordsRef.current,
      { y: "100%" },
      {
        y: "0%",
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      }
    ).to(
      wordsRef.current,
      {
        y: "-100%",
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.in",
      },
      "-=0.1"
    );
  }, []);
  return (
    <>
      <main className={styles["question"]} ref={questionRef}>
        <div className={styles["container"]} ref={containerRef}>
          <h2 className={styles["header"]} ref={headerRef}>
            <span className={styles["header__overflow"]}>
              <span className={styles["header__word"]} ref={addWordRef}>
                WHO&nbsp;
              </span>
            </span>
            <span className={styles["header__overflow"]}>
              <span className={styles["header__word"]} ref={addWordRef}>
                IS&nbsp;
              </span>
            </span>
            <span className={styles["header__overflow"]}>
              <span className={styles["header__word"]} ref={addWordRef}>
                CANDY&nbsp;
              </span>
            </span>
            <span className={styles["header__overflow"]}>
              <span className={styles["header__word"]} ref={addWordRef}>
                HEIST?
              </span>
            </span>
          </h2>
        </div>
      </main>
      <div className={styles["test"]}>bruh momentum</div>
    </>
  );
};

export default InfoSection;
