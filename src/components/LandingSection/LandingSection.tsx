"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import styles from "./styles.module.scss";
import LetterAnimation from "../LetterAnimation/LetterAnimation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const LandingSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "30%"]);
  const firstText = useRef<HTMLParagraphElement>(null);
  const secondText = useRef<HTMLParagraphElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  let xPercent = 0;
  const direction = useRef(-1);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(slider.current, {
      scrollTrigger: {
        trigger: document.documentElement,
        scrub: 0.5,
        start: 0,
        end: window.innerHeight,
        onUpdate: (e) => (direction.current = e.direction * -1),
      },
      x: "-500px",
    });
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animate = () => {
    // Get the actual width of the text element
    const textWidth = firstText.current?.offsetWidth || 0;
    const containerWidth = slider.current?.offsetWidth || 0;

    // Calculate the percentage based on actual text width
    const resetPoint = -(textWidth / containerWidth) * 100;

    if (xPercent <= resetPoint) {
      xPercent = 0;
    } else if (xPercent > 0) {
      xPercent = resetPoint;
    }

    gsap.set(firstText.current, { xPercent: xPercent });
    gsap.set(secondText.current, { xPercent: xPercent });
    requestAnimationFrame(animate);
    xPercent += 0.1 * direction.current;
  };

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

      <div className={styles["slider-container"]}>
        <div ref={slider} className={styles["slider"]}>
          <p ref={firstText}>
            <LetterAnimation text="Candy Heist -" element="span" />
          </p>
          <p ref={secondText}>
            <LetterAnimation text="Candy Heist -" element="span" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingSection;
