"use client";

import { animate, AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import navItems from "./navItem";
import styles from "./styles.module.scss";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const animateNavItem = async (index: number) => {
    const baseDelay = 0.4 + index * 0.1;
    const revealSelector = `div[data-index="reveal__${index}"]`;
    const textSelector = `div[data-index="text__${index}"]`;

    // Set initial states for both elements
    await Promise.all([
      animate(
        revealSelector,
        { scaleX: 0, transformOrigin: "left" },
        { duration: 0 }
      ),
      animate(textSelector, { visibility: "hidden", x: -20 }, { duration: 0 }),
    ]);

    // Wait for the base delay
    await new Promise((resolve) => setTimeout(resolve, baseDelay * 1000));

    // First grow the reveal from left
    await animate(
      revealSelector,
      { scaleX: 1 },
      {
        duration: 0.8,
        ease: [0.65, 0.05, 0, 1],
      }
    );

    // Change transform origin to right for the reveal
    await animate(
      revealSelector,
      { transformOrigin: "right" },
      { duration: 0 }
    );

    // Start shrinking the reveal while simultaneously showing and moving the text
    const shrinkPromise = animate(
      revealSelector,
      { scaleX: 0 },
      {
        duration: 0.8,
        ease: [0.65, 0.05, 0, 1],
        delay: 0.2,
      }
    );

    // As the reveal starts to shrink, show the text and animate it
    const textPromise = animate(
      textSelector,
      { visibility: "visible", x: 0 },
      {
        duration: 1,
        ease: [0.65, 0.05, 0, 1],
        delay: 0.3, // Slightly delayed to start when the reveal is partially shrunk
      }
    );

    // Wait for both animations to finish
    await Promise.all([shrinkPromise, textPromise]);

    // Fade in Coming Soon badge if navItem is disabled
    if (!navItems[index].active) {
      const link = document.querySelector(`a[data-nav-index="${index}"]`);
      if (link) link.classList.add(styles["show-badge"]);
    }
  };

  // Trigger animations when menu opens
  useEffect(() => {
    if (isOpen) {
      navItems.forEach((_, index) => {
        animateNavItem(index);
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
                  width: "55%",
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
                  width: "55%",
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
                  width: "55%",
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
            >
              <motion.div className={styles["content"]}>
                <motion.div className={styles["main-left"]}>
                  <motion.div className={styles["grid"]}>
                    <motion.div
                      className={clsx(
                        styles["grid-item"],
                        styles["grid-item--1"]
                      )}
                      onClick={() => router.push("/track")}
                    >
                      <motion.div className={styles["image-container"]}>
                        <Image
                          src="/images/back.png"
                          alt="Logo"
                          className={styles["release-image"]}
                          fill={true}
                          objectFit="cover"
                          priority
                        />
                      </motion.div>

                      <motion.div className={styles["details"]}>
                        <motion.h2 className={styles["details__title"]}>
                          LATEST RELEASE
                        </motion.h2>
                        <motion.p className={styles["details__track"]}>
                          Title Name
                        </motion.p>
                        <motion.div className={styles["details__icon"]}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16 0L3.60068 -5.41991e-07L16 12.3996L16 0Z"
                              fill="#0E141D"
                            />
                            <path
                              d="M12.3994 3.60052L-1.33514e-05 3.60052L12.3994 16L12.3994 3.60052Z"
                              fill="#0E141D"
                            />
                            <path
                              d="M12.3994 8.79916L12.3994 3.60052L7.20074 3.60052L12.3994 8.79916Z"
                              fill="#0E141D"
                            />
                          </svg>
                        </motion.div>
                      </motion.div>

                      {[1, 2, 3, 4, 5, 6].map((number) => (
                        <motion.div
                          key={number}
                          className={clsx(
                            styles["circle"],
                            styles[`circle--${number}`]
                          )}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${number * 15}rem`,
                            transition: {
                              duration: 1,
                              ease: [0.65, 0.05, 0, 1],
                              delay: 0.5 + number * 0.05,
                            },
                          }}
                        ></motion.div>
                      ))}
                    </motion.div>
                    <motion.div
                      className={clsx(
                        styles["grid-item"],
                        styles["grid-item--2"]
                      )}
                    >
                      <div className={styles["news-title"]}>
                        <motion.h1 className={styles["news-heading"]}>
                          NEWS
                        </motion.h1>
                        <motion.div className={styles["news-icon"]}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16 0L3.60068 -5.41991e-07L16 12.3996L16 0Z"
                              fill="#fff"
                            />
                            <path
                              d="M12.3994 3.60052L-1.33514e-05 3.60052L12.3994 16L12.3994 3.60052Z"
                              fill="#fff"
                            />
                            <path
                              d="M12.3994 8.79916L12.3994 3.60052L7.20074 3.60052L12.3994 8.79916Z"
                              fill="#fff"
                            />
                          </svg>
                        </motion.div>
                      </div>
                      <div className={styles["news-desc"]}>
                        <motion.h3 className={styles["desc-title"]}>
                          Title
                        </motion.h3>
                        <motion.p className={styles["desc-desc"]}>
                          Description about the news
                        </motion.p>
                      </div>
                    </motion.div>
                    <motion.div
                      className={clsx(
                        styles["grid-item"],
                        styles["grid-item--3"]
                      )}
                    >
                      <div className={styles["updates-image-container"]}>
                        <Image
                          src="/images/back.png"
                          alt="Logo"
                          className={styles["updates-image"]}
                          fill={true}
                          objectFit="cover"
                          priority
                        />
                      </div>
                      <div className={styles["updates-grid"]}>
                        <motion.div className={styles["updates-details"]}>
                          <motion.h2 className={styles["updates-title"]}>
                            UPDATES
                          </motion.h2>
                          <motion.p className={styles["updates-desc"]}>
                            Description about the updates
                          </motion.p>
                        </motion.div>
                        <motion.div className={styles["updates-icon"]}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16 0L3.60068 -5.41991e-07L16 12.3996L16 0Z"
                              fill="#fff"
                            />
                            <path
                              d="M12.3994 3.60052L-1.33514e-05 3.60052L12.3994 16L12.3994 3.60052Z"
                              fill="#fff"
                            />
                            <path
                              d="M12.3994 8.79916L12.3994 3.60052L7.20074 3.60052L12.3994 8.79916Z"
                              fill="#fff"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                  <motion.div className={styles["footer"]}></motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div
              className={clsx(styles.section, styles["section--right"])}
            >
              {navItems.map((item, index) => {
                return (
                  <Link
                    href={item.href}
                    className={clsx(
                      styles["nav-link"],
                      !item.active && styles["nav-link--disabled"]
                    )}
                    key={item.name + "__" + index}
                    data-nav-index={index}
                  >
                    <div
                      className={clsx(styles["text-reveal"])}
                      data-index={`reveal__${index}`}
                    ></div>
                    <div
                      data-index={`text__${index}`}
                      className={styles["nav-item"]}
                    >
                      {item.name}
                    </div>
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
