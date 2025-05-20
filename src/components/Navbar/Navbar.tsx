"use client";

import { animate, AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

import { useEffect, useState } from "react";

import navItems from "./navItem";
import styles from "./styles.module.scss";
import Link from "next/link";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const animateTextReveal = async (index: number) => {
    const delay = 0.4 + index * 0.2;
    const selector = `div[data-index="${index}"]`;

    // Set initial state
    await animate(
      selector,
      { scaleX: 0, transformOrigin: "left" },
      { duration: 0 }
    );

    // Wait for the delay
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));

    // First grow from left
    await animate(
      selector,
      { scaleX: 1 },
      {
        duration: 1.2,
        ease: [0.65, 0.05, 0, 1],
      }
    );

    // Change transform origin to right
    await animate(selector, { transformOrigin: "right" }, { duration: 0 });

    // Then shrink from right
    await animate(
      selector,
      { scaleX: 0 },
      {
        duration: 1.2,
        ease: [0.65, 0.05, 0, 1],
        delay: 0.2,
      }
    );
  };

  // Trigger animations when menu opens
  useEffect(() => {
    if (isOpen) {
      navItems.forEach((_, index) => {
        animateTextReveal(index);
      });
    }
  }, [isOpen]);

  return (
    <>
      <div
        className={styles.hamburger}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setIsOpen(!isOpen);
          }
        }}
        tabIndex={0}
      >
        <AnimatePresence mode="popLayout">
          {!isOpen ? (
            <motion.div
              key="bars"
              style={{ position: "relative", width: "100%", height: "100%" }}
            >
              <motion.div
                className={clsx(styles["bar"], styles["bar--1"])}
                initial={{ width: 0 }}
                animate={{
                  width: "65%",
                  transition: { duration: 0.6, ease: [0.65, 0.05, 0, 1] },
                }}
                exit={{
                  width: 0,
                  transition: { duration: 0.6, ease: [0.65, 0.05, 0, 1] },
                }}
              ></motion.div>
              <motion.div
                className={clsx(styles["bar"], styles["bar--2"])}
                initial={{ width: 0 }}
                animate={{
                  width: "65%",
                  transition: {
                    duration: 0.6,
                    ease: [0.65, 0.05, 0, 1],
                    delay: 0.1,
                  },
                }}
                exit={{
                  width: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.1,
                    ease: [0.65, 0.05, 0, 1],
                  },
                }}
              ></motion.div>
              <motion.div
                className={clsx(styles["bar"], styles["bar--3"])}
                initial={{ width: 0 }}
                animate={{
                  width: "65%",
                  transition: {
                    duration: 0.6,
                    ease: [0.65, 0.05, 0, 1],
                    delay: 0.2,
                  },
                }}
                exit={{
                  width: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.2,
                    ease: [0.65, 0.05, 0, 1],
                  },
                }}
              ></motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="lines"
              style={{ position: "relative", width: "100%", height: "100%" }}
            >
              <motion.div
                className={clsx(styles["line"], styles["line--1"])}
                initial={{ width: 0 }}
                animate={{
                  width: "65%",
                  transition: {
                    duration: 0.6,
                    ease: [0.65, 0.05, 0, 1],
                    delay: 0.2,
                  },
                }}
                exit={{
                  width: 0,
                  transition: { duration: 0.6, ease: [0.65, 0.05, 0, 1] },
                }}
              ></motion.div>
              <motion.div
                className={clsx(styles["line"], styles["line--2"])}
                initial={{ width: 0 }}
                animate={{
                  width: "65%",
                  transition: {
                    duration: 0.6,
                    ease: [0.65, 0.05, 0, 1],
                    delay: 0.4,
                  },
                }}
                exit={{
                  width: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.1,
                    ease: [0.65, 0.05, 0, 1],
                  },
                }}
              ></motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.navbar}
            initial={{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
            animate={{
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
            }}
            exit={{
              clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
              transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
            }}
          >
            <motion.div
              className={clsx(styles.section, styles["section--left"])}
            ></motion.div>
            <motion.div
              className={clsx(styles.section, styles["section--right"])}
            >
              {navItems.map((item, index) => {
                return (
                  <Link
                    href={item.href}
                    className={styles["nav-link"]}
                    key={item.name + "__" + index}
                  >
                    <div
                      className={styles["text-reveal"]}
                      data-index={index}
                    ></div>
                    <motion.div
                      className={styles["nav-item"]}
                      initial={{ x: -20 }}
                      animate={{
                        x: 0,
                        transition: {
                          duration: 1,
                          delay: 2 + index * 0.2,
                          ease: [0.65, 0.05, 0, 1],
                        },
                      }}
                    >
                      {item.name}
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
