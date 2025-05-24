"use client";

import { animate, AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import navItems from "./navItem";
import styles from "./styles.module.scss";
import newStyles from "./newstyles.module.scss";
import SocialLogo from "../SocialLogo/SocialLogo";

const AnimateText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  return (
    <>
      {text.split("").map((letter, index) => {
        return (
          <span
            key={letter + "__" + index}
            style={{
              overflow: "hidden",
              lineHeight: 1,
              display: "inline-block",
            }}
          >
            <motion.span
              style={{
                display: "inline-block",
                lineHeight: 1,
              }}
              initial={{ y: "100%" }}
              animate={{
                y: 0,
                transition: {
                  duration: 1,
                  ease: [0.65, 0.05, 0, 1],
                  delay: delay + index * 0.05,
                },
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          </span>
        );
      })}
    </>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

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
              transition: { duration: 1, ease: [0.65, 0.05, 0, 1], delay: 0.2 },
            }}
          >
            <motion.div
              className={clsx(styles.section, styles["section--left"])}
            >
              {/* <motion.div className={styles["content"]}>
                <motion.div className={styles["main-left"]}>
                  <motion.div className={styles["grid"]}>
                    <motion.div
                      className={clsx(
                        styles["grid-item"],
                        styles["grid-item--1"]
                      )}
                      initial={{
                        clipPath:
                          "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)",
                      }}
                      animate={{
                        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
                        transition: {
                          duration: 1,
                          ease: [0.65, 0.05, 0, 1],
                          delay: 0.6,
                        },
                      }}
                      exit={{
                        clipPath:
                          "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
                        transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
                      }}
                      onClick={() => router.push("/track")}
                    >
                      <motion.div
                        className={styles["image-container"]}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          transition: {
                            duration: 1,
                            delay: 0.8,
                          },
                        }}
                      >
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
                          <AnimateText text="LATEST RELEASE" delay={1} />
                        </motion.h2>
                        <motion.p className={styles["details__track"]}>
                          <AnimateText text="TITLE NAME" delay={1.1} />
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
                      initial={{
                        clipPath: "polygon(0 0, 0% 0, 0% 100%, 0 100%)",
                      }}
                      animate={{
                        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                        transition: {
                          duration: 1,
                          ease: [0.65, 0.05, 0, 1],
                          delay: 0.6,
                        },
                      }}
                      exit={{
                        clipPath:
                          "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
                        transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
                      }}
                    >
                      <div className={styles["news-title"]}>
                        <motion.h1 className={styles["news-heading"]}>
                          <AnimateText text="NEWS" delay={1.2} />
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
                          <AnimateText text="TITLE" delay={1.3} />
                        </motion.h3>
                        <motion.p className={styles["desc-desc"]}>
                          <AnimateText
                            text="Description about the news"
                            delay={1.2}
                          />
                        </motion.p>
                      </div>
                    </motion.div>
                    <motion.div
                      className={clsx(
                        styles["grid-item"],
                        styles["grid-item--3"]
                      )}
                      initial={{
                        clipPath: "polygon(0 0, 0% 0, 0% 100%, 0 100%)",
                      }}
                      animate={{
                        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                        transition: {
                          duration: 1,
                          ease: [0.65, 0.05, 0, 1],
                          delay: 1,
                        },
                      }}
                      exit={{
                        clipPath:
                          "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
                        transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
                      }}
                    >
                      <motion.div
                        className={styles["updates-image-container"]}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          transition: {
                            duration: 1,
                            delay: 0.8,
                          },
                        }}
                        exit={{
                          opacity: 0,
                          transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
                        }}
                      >
                        <Image
                          src="/images/back.png"
                          alt="Logo"
                          className={styles["updates-image"]}
                          fill={true}
                          objectFit="cover"
                          priority
                        />
                      </motion.div>
                      <div className={styles["updates-grid"]}>
                        <motion.div className={styles["updates-details"]}>
                          <motion.h2 className={styles["updates-title"]}>
                            <AnimateText text="UPDATES" delay={1.3} />
                          </motion.h2>
                          <motion.p className={styles["updates-desc"]}>
                            <AnimateText
                              text="Description about the updates"
                              delay={1.4}
                            />
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
              </motion.div> */}
              <motion.div className={newStyles["content"]}>
                <div className={newStyles["grid"]}>
                  <motion.div
                    className={newStyles["grid__release"]}
                    initial={{
                      clipPath:
                        "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)",
                    }}
                    animate={{
                      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
                      transition: {
                        duration: 1,
                        ease: [0.65, 0.05, 0, 1],
                        delay: 0.6,
                      },
                    }}
                    exit={{
                      clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
                      transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
                    }}
                  >
                    <motion.div
                      className={newStyles["image-container"]}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: {
                          duration: 1,
                          delay: 0.8,
                        },
                      }}
                    >
                      <Image
                        src="/images/back.png"
                        alt="Logo"
                        className={newStyles["release-image"]}
                        fill={true}
                        objectFit="cover"
                        priority
                      />
                    </motion.div>
                    <motion.div className={newStyles["release-details"]}>
                      <motion.h2 className={newStyles["details__title"]}>
                        <AnimateText text="LATEST RELEASE" delay={1} />
                      </motion.h2>
                      <motion.p className={newStyles["details__track"]}>
                        <AnimateText text="TITLE NAME" delay={1.1} />
                      </motion.p>
                      <motion.div className={newStyles["details__icon"]}>
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
                          newStyles["circle"],
                          newStyles[`circle--${number}`]
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
                    className={newStyles["grid__news"]}
                    initial={{
                      clipPath: "polygon(0 0, 0% 0, 0% 100%, 0 100%)",
                    }}
                    animate={{
                      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                      transition: {
                        duration: 1,
                        ease: [0.65, 0.05, 0, 1],
                        delay: 0.6,
                      },
                    }}
                    exit={{
                      clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
                      transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
                    }}
                  >
                    <div className={newStyles["news-title"]}>
                      <motion.h1 className={newStyles["news-heading"]}>
                        <AnimateText text="NEWS" delay={1.2} />
                      </motion.h1>
                      <motion.div className={newStyles["news-icon"]}>
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
                    <div className={newStyles["news-desc"]}>
                      <motion.h3 className={newStyles["desc-title"]}>
                        <AnimateText text="TITLE" delay={1.3} />
                      </motion.h3>
                      <motion.p className={newStyles["desc-desc"]}>
                        <AnimateText
                          text="Description about the news"
                          delay={1.2}
                        />
                      </motion.p>
                    </div>
                  </motion.div>
                  <motion.div
                    className={newStyles["grid__update"]}
                    initial={{
                      clipPath: "polygon(0 0, 0% 0, 0% 100%, 0 100%)",
                    }}
                    animate={{
                      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                      transition: {
                        duration: 1,
                        ease: [0.65, 0.05, 0, 1],
                        delay: 0.8,
                      },
                    }}
                    exit={{
                      clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
                      transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
                    }}
                  >
                    <motion.div
                      className={newStyles["updates-image-container"]}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: {
                          duration: 1,
                          delay: 0.8,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        transition: { duration: 1, ease: [0.65, 0.05, 0, 1] },
                      }}
                    >
                      <Image
                        src="/images/back.png"
                        alt="Logo"
                        className={newStyles["updates-image"]}
                        fill={true}
                        objectFit="cover"
                        priority
                      />
                    </motion.div>
                    <motion.div className={newStyles["updates"]}>
                      <div className={newStyles["updates-text"]}>
                        <motion.h2 className={newStyles["updates-title"]}>
                          <AnimateText text="UPDATES" delay={1.3} />
                        </motion.h2>
                        <motion.p className={newStyles["updates-desc"]}>
                          <AnimateText
                            text="Description about the updates"
                            delay={1.4}
                          />
                        </motion.p>
                      </div>
                      <div className={newStyles["updates-icon"]}>
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
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
                <div className={newStyles["footer"]}>
                  <div className={newStyles["socials"]}>
                    {Object.entries(SocialLogo).map(([name, IconComponent]) => (
                      <motion.div
                        key={name}
                        className={newStyles["social"]}
                        aria-label={
                          name === "applemusic" ? "Apple Music" : name
                        }
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 1,
                            ease: [0.65, 0.05, 0, 1],
                            delay:
                              0.6 + Object.keys(SocialLogo).indexOf(name) * 0.1,
                          },
                        }}
                        exit={{
                          opacity: 0,
                          y: 20,
                          transition: {
                            duration: 0.6,
                            ease: [0.65, 0.05, 0, 1],
                            delay: Object.keys(SocialLogo).indexOf(name) * 0.1,
                          },
                        }}
                      >
                        <IconComponent
                          width={28}
                          height={28}
                          className={newStyles["social-icon"]}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <div className={newStyles["copyright"]}>
                    <motion.p
                      className={newStyles["copyright__disclaimer"]}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { duration: 0.6, delay: 1 },
                      }}
                      exit={{ opacity: 0 }}
                    >
                      Candy Heist &copy; {new Date().getFullYear()}
                    </motion.p>
                    <motion.p
                      className={newStyles["copyright__dev"]}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { duration: 0.6, delay: 1.4 },
                      }}
                      exit={{ opacity: 0 }}
                    >
                      Developed and Designed by Haneesh Raj
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              className={clsx(styles.section, styles["section--right"])}
              exit={{
                opacity: 0,
                transition: { duration: 0.6 },
              }}
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
              <div
                className={clsx(
                  newStyles["socials"],
                  newStyles["socials--mobile"]
                )}
              >
                {Object.entries(SocialLogo).map(([name, IconComponent]) => (
                  <motion.div
                    key={name}
                    className={newStyles["social"]}
                    aria-label={name === "applemusic" ? "Apple Music" : name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 1,
                        ease: [0.65, 0.05, 0, 1],
                        delay:
                          0.6 + Object.keys(SocialLogo).indexOf(name) * 0.1,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      y: 20,
                      transition: {
                        duration: 0.6,
                        ease: [0.65, 0.05, 0, 1],
                        delay: Object.keys(SocialLogo).indexOf(name) * 0.1,
                      },
                    }}
                  >
                    <IconComponent
                      width={28}
                      height={28}
                      className={newStyles["social-icon"]}
                    />
                  </motion.div>
                ))}
              </div>
              <div
                className={clsx(
                  newStyles["copyright"],
                  newStyles["copyright--mobile"]
                )}
              >
                <motion.p
                  className={newStyles["copyright__disclaimer"]}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.6, delay: 1 },
                  }}
                  exit={{ opacity: 0 }}
                >
                  Candy Heist &copy; {new Date().getFullYear()}
                </motion.p>
                <motion.p
                  className={newStyles["copyright__dev"]}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.6, delay: 1.4 },
                  }}
                  exit={{ opacity: 0 }}
                >
                  Developed and Designed by Haneesh Raj
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
