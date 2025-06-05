"use client";

import { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import { AnimatePresence, motion, animate } from "motion/react";
import clsx from "clsx";
import navItems from "./navItem";
import SocialLogo from "../SocialLogo/SocialLogo";
import socialLink from "@/utils/socials";
import Link from "next/link";
import Image from "next/image";
import LetterAnimation from "../LetterAnimation/LetterAnimation";
import WordAnimation from "../WordAnimation/WordAnimation";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [trackDetails, setTrackDetails] = useState({
    title: "Track Name",
    artist: ["Artist Name1", "Artist Name2"],
    image: "/images/back.png",
  });

  const [newsDetails, setNewsDetails] = useState({
    title: "News Title",
    description: "Description about the news here.",
  });
  const [updatesDetails, setUpdatesDetails] = useState({
    image: "/images/back.png",
    title: "Updates Title",
    description: "Description about the updates here.",
  });

  return (
    <>
      <div
        className={styles["hamburger"]}
        tabIndex={0}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <>
              <motion.div
                className={clsx(
                  styles["hamburger__cross"],
                  styles["hamburger__cross--1"]
                )}
                initial={{
                  x: "-50%",
                  y: "-50%",
                  scale: 0,
                  rotate: 45,
                }}
                animate={{ x: "-50%", y: "-50%", scale: 1, rotate: 45 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.6, ease: [0.52, -0.01, 0, 0.95] }}
              ></motion.div>
              <motion.div
                className={clsx(
                  styles["hamburger__cross"],
                  styles["hamburger__cross--2"]
                )}
                initial={{
                  x: "-50%",
                  y: "-50%",
                  scale: 0,
                  rotate: -45,
                }}
                animate={{ x: "-50%", y: "-50%", scale: 1, rotate: -45 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.6, ease: [0.52, -0.01, 0, 0.95] }}
              ></motion.div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!isOpen && (
            <>
              <motion.div
                className={clsx(
                  styles["hamburger__bar"],
                  styles["hamburger__bar--1"]
                )}
                initial={{
                  x: "-50%",
                  y: "-50%",
                  scale: 0,
                  transformOrigin: "left",
                }}
                animate={{ x: "-50%", y: "-50%", scale: 1 }}
                exit={{ width: 0 }}
                transition={{ duration: 0.6, ease: [0.52, -0.01, 0, 0.95] }}
              ></motion.div>
              <motion.div
                className={clsx(
                  styles["hamburger__bar"],
                  styles["hamburger__bar--2"]
                )}
                initial={{
                  x: "-50%",
                  y: "-50%",
                  scale: 0,
                  transformOrigin: "left",
                }}
                animate={{ x: "-50%", y: "-50%", scale: 1 }}
                exit={{ width: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.52, -0.01, 0, 0.95],
                  delay: 0.1,
                }}
              ></motion.div>
              <motion.div
                className={clsx(
                  styles["hamburger__bar"],
                  styles["hamburger__bar--3"]
                )}
                initial={{
                  x: "-50%",
                  y: "-50%",
                  scale: 0,
                  transformOrigin: "left",
                }}
                animate={{ x: "-50%", y: "-50%", scale: 1 }}
                exit={{ width: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.52, -0.01, 0, 0.95],
                  delay: 0.2,
                }}
              ></motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            className={styles["navbar"]}
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
            <div className={styles["navbar__container"]}>
              <ul className={styles["navbar__news"]}>
                <li className={styles["grid"]}>
                  <motion.div
                    className={styles["release"]}
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
                    <div className={styles["release__image"]}>
                      <div className={styles["release__image-wrapper"]}>
                        <Image
                          src={trackDetails.image}
                          alt="Release Image"
                          fill={true}
                          objectFit="cover"
                          priority
                        />
                      </div>
                    </div>
                    <div className={styles["release__details"]}>
                      <LetterAnimation
                        text="Latest Release"
                        className={styles["release__title"]}
                        element="h3"
                      />
                      <LetterAnimation
                        text={trackDetails.title}
                        className={styles["release__track-name"]}
                        element="p"
                      />

                      <WordAnimation
                        text={trackDetails.artist.join(" • ")}
                        className={styles["release__artist-name"]}
                        element="p"
                      />
                    </div>

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
                    className={styles["news"]}
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
                    <LetterAnimation
                      text="NEWS"
                      className={styles["news__main-title"]}
                      element="h3"
                    />
                    <div className={styles["news__details"]}>
                      <WordAnimation
                        text={newsDetails.title}
                        className={styles["news__sub-title"]}
                        element="h4"
                      />
                      <WordAnimation
                        text={newsDetails.description}
                        className={styles["news__description"]}
                        element="p"
                      />
                    </div>
                  </motion.div>
                  <motion.div
                    className={styles["updates"]}
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
                    <div className={styles["updates__image"]}>
                      <div className={styles["updates__image-wrapper"]}>
                        <Image
                          src={updatesDetails.image || "/images/back.png"}
                          alt="Updates Image"
                          fill={true}
                          objectFit="cover"
                          priority
                        />
                      </div>
                    </div>
                    <div className={styles["updates__details"]}>
                      <WordAnimation
                        text={updatesDetails.title}
                        className={styles["updates__sub-title"]}
                        element="h4"
                      />
                      <WordAnimation
                        text={updatesDetails.description}
                        className={styles["updates__description"]}
                        element="p"
                      />
                    </div>
                  </motion.div>
                </li>
                <li className={styles["footer"]}>
                  <div className={styles["footer__socials"]}>
                    {Object.entries(SocialLogo).map(([name, IconComponent]) => (
                      <motion.div
                        key={name}
                        className={styles["social"]}
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
                        <Link
                          href={socialLink[name as keyof typeof socialLink]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles["social__link"]}
                        >
                          <IconComponent
                            width={28}
                            height={28}
                            className={styles["social-icon"]}
                          />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  <div className={styles["footer__copyright"]}>
                    <p>
                      Candy Heist {new Date().getFullYear()} &copy; . All rights
                      reserved.
                    </p>
                    <p>Developed and Designed by @haneeshrajb</p>
                  </div>
                </li>
              </ul>{" "}
              <ul className={styles["navbar__list"]}></ul>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
