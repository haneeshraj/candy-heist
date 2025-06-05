"use client";

import { animate, AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import navItems from "../navItem";
import styles from "./styles.module.scss";
import newStyles from "./newstyles.module.scss";
import SocialLogo from "../../SocialLogo/SocialLogo";

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
            <Link
              href="/"
              className={styles["logo"]}
              onClick={() => setIsOpen(false)}
            >
              <svg
                width="40"
                height="28"
                viewBox="0 0 40 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M39.1736 1.07954C40.7866 4.68968 40.0062 9.71591 37.114 14.4766C35.3081 17.4608 32.7941 20.4027 29.6984 22.6991C24.4553 26.5504 18.3604 28.7238 13.5099 27.7807C9.58172 27.1116 7.17481 24.8988 6.98959 21.1066C6.77447 16.8696 9.9512 11.4783 15.2985 8.4875C18.5234 6.65944 22.2703 6.18084 24.2064 7.76585C24.8509 8.28199 25.2483 9.01302 25.4171 9.8426C25.4171 9.8426 25.2705 10.8345 25.1837 11.269C25.0727 11.9381 24.6946 12.7949 24.109 13.4715C23.0594 14.7459 21.1763 15.9095 19.8181 15.6778C19.1023 15.5332 18.5254 14.9157 18.5669 14.9139C18.5968 14.9157 18.6016 14.9092 18.5746 14.9186C18.5244 14.9326 18.4106 15.0133 18.3604 15.0659C17.5491 15.8035 17.2964 16.7241 17.5838 17.396C18.1106 18.3729 19.3261 18.9228 20.8406 18.6441C24.0752 18.1468 27.3938 15.5586 28.9961 12.641C30.6921 9.53948 30.8155 6.8368 29.328 4.79103C28.0826 3.00989 25.7991 2.01609 23.072 1.95979C21.3924 1.94665 19.5586 2.31263 17.7121 2.9198C16.5796 3.29799 15.421 3.75125 14.2962 4.28052C10.9226 5.88148 7.85589 8.60387 5.44512 11.407C2.84046 14.531 1.2217 18.0116 0.648677 21.2107C0.302353 23.2537 0.324541 25.1972 0.694018 26.9802C0.460562 26.3064 0.280165 25.6026 0.169225 24.865C-0.588057 20.4093 1.19662 14.6783 5.51651 9.78254C8.29482 6.61627 11.5883 3.87043 15.4962 2.20659C18.2659 0.962234 21.1522 0.0998173 23.7636 0.00785121C27.1304 -0.105699 29.9907 1.01666 31.5921 3.09998C33.0199 4.89238 33.4347 7.5228 32.4671 10.3587C32.1603 11.2934 31.7281 12.2506 31.2149 13.189C30.0698 15.141 28.3932 17.0263 26.3452 18.4874C24.2904 19.9664 21.9018 20.9574 19.7399 21.2361C17.578 21.5242 15.8271 20.7781 14.956 19.4352C14.1167 18.1317 14.5316 15.9856 16.1783 14.211C16.3249 14.0608 16.5043 13.8741 16.6577 13.7286C17.1854 13.2341 17.7768 12.839 18.4472 12.5715C19.409 12.1737 20.4692 12.1896 20.9824 12.7076C21.0664 12.7921 21.2284 12.9413 21.3201 13.0145C21.405 13.0839 21.8671 12.747 22.0581 12.4965C22.1516 12.3698 22.3591 12.2103 22.416 11.9137C22.4787 11.6172 22.4816 11.102 22.4816 11.102C22.0156 8.98112 18.8649 8.93326 16.2101 10.3691L15.9583 10.4995L15.7094 10.645C15.5676 10.7275 15.3525 10.8505 15.2165 10.9443C12.5385 12.6372 10.5754 15.3493 9.92419 17.8042C9.25565 20.1982 9.65697 22.3969 10.994 23.858C11.5574 24.4389 12.2356 24.9166 13.045 25.2497C13.5157 25.4515 14.0589 25.5923 14.5846 25.7283C16.4754 26.2032 18.7231 26.1553 21.0837 25.5116C24.1351 24.6876 27.3455 23.0322 30.0785 20.9358C33.5668 18.1777 36.3008 14.6352 37.9398 11.147C39.5875 7.56221 40.0245 3.97835 39.1765 1.08048L39.1736 1.07954Z"
                  fill="white"
                />
              </svg>
            </Link>
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
                    onClick={() => {
                      setIsOpen(false);
                    }}
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
