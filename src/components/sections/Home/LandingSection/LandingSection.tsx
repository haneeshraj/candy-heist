"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import styles from "./styles.module.scss";
import LetterAnimation from "../../../LetterAnimation/LetterAnimation";
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
    xPercent += 0.2 * direction.current;
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

      <div className={styles["details"]}>
        <div className={styles["details__logo"]}>
          <svg
            style={{ scale: "-1 1" }}
            width="36"
            height="36"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M200.271 0H199.728C144.571 0 94.6236 22.3378 58.5126 58.5126C22.3378 94.6236 0 144.571 0 199.728C0 310.011 89.4145 399.457 199.728 399.457H400V199.728C400 89.4145 310.586 0 200.271 0ZM200.016 345.994C119.23 345.994 53.7192 280.483 53.7192 199.697C53.7192 118.911 119.23 53.4321 200.016 53.4321C280.803 53.4321 346.282 118.911 346.282 199.697C346.282 280.483 280.803 345.994 200.016 345.994Z"
              fill="#ddd"
            />
            <path
              d="M284.636 199.699C284.636 246.452 246.735 284.351 200.015 284.351C153.294 284.351 115.394 246.451 115.394 199.73C115.426 152.946 153.263 115.109 200.015 115.109C246.767 115.109 284.604 152.947 284.636 199.699Z"
              fill="#ddd"
            />
          </svg>
        </div>
        <div className={styles["details__text"]}>
          <LetterAnimation
            text="Based in"
            element="p"
            className={styles["details__text-1"]}
          />
          <LetterAnimation
            text="Halifax, Nova Scotia"
            element="p"
            className={styles["details__text-2"]}
          />
        </div>
      </div>

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
