"use client";

import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import styles from "./styles.module.scss";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <motion.div
        className={clsx(
          styles.hamburger,
          isOpen && styles["hamburger--active"]
        )}
        onClick={() => setIsOpen(!isOpen)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.5,
          delay: 0.5,
        }}
      >
        <div
          className={clsx(styles.circles, isOpen && styles["circles--active"])}
        >
          <div
            className={clsx(
              styles.dot,
              styles["dot--1"],
              isOpen && styles["dot--1-active"]
            )}
          ></div>
          <div
            className={clsx(
              styles.dot,
              styles["dot--2"],
              isOpen && styles["dot--2-active"]
            )}
          ></div>
          <div
            className={clsx(
              styles.dot,
              styles["dot--3"],
              isOpen && styles["dot--3-active"]
            )}
          ></div>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div className={styles.close}>
              <motion.div
                className={clsx(styles.close__line, styles["close__line--1"])}
                initial={{ height: 0 }}
                animate={{
                  height: "1.6rem",
                  transition: { ease: [0.77, 0.48, 0.26, 1.67], duration: 0.7 },
                }}
                exit={{
                  height: 0,
                  transition: { ease: [0.77, 0.48, 0.26, 1.67], duration: 0.5 },
                }}
              ></motion.div>
              <motion.div
                className={clsx(styles.close__line, styles["close__line--2"])}
                initial={{ height: 0 }}
                animate={{
                  height: "1.6rem",
                  transition: {
                    delay: 0.1,
                    ease: [0.77, 0.48, 0.26, 1.67],
                    duration: 0.7,
                  },
                }}
                exit={{
                  height: 0,
                  transition: {
                    ease: [0.77, 0.48, 0.26, 1.67],
                    duration: 0.5,
                    delay: 0.1,
                  },
                }}
              ></motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div className={styles["navbar"]}>
              <motion.div
                className={styles["navbar__background"]}
                initial={{ clipPath: "inset(0 0 100% 0 )" }}
                animate={{
                  clipPath: isOpen ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
                  transition: {
                    ease: [0.56, 0, 0, 0.95],
                    duration: 1.4,
                  },
                }}
                exit={{
                  clipPath: "inset(0 0 100% 0)",
                  transition: {
                    ease: [0.56, 0, 0, 0.95],
                    duration: 1.4,
                  },
                }}
              >
                <motion.div
                  className={styles["navbar__container"]}
                  initial={{ y: -70 }}
                  animate={{
                    y: 0,
                    transition: {
                      ease: [0.56, 0, 0, 0.95],
                      duration: 1.4,
                    },
                  }}
                  exit={{
                    y: -70,
                    transition: {
                      ease: [0.56, 0, 0, 0.95],
                      duration: 1.4,
                    },
                  }}
                >
                  <div
                    className={clsx(styles["section"], styles["section__left"])}
                  ></div>
                  <div
                    className={clsx(
                      styles["section"],
                      styles["section__right"]
                    )}
                  ></div>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
