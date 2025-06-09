"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import styles from "./styles.module.scss";
import LetterAnimation from "@/components/LetterAnimation/LetterAnimation";
import WordAnimation from "@/components/WordAnimation/WordAnimation";
import Link from "next/link";
import ImageComp from "@/components/ImageComp/ImageComp";
import Platform from "./Platform";

const WorkSection = () => {
  type Work = {
    id: number;
    trackName: string;
    artists: string[];
    genres: string[];
    platforms: { name: string; url: string }[];
    image?: string; // Optional image property
  };

  const works = [
    {
      id: 1,
      trackName: "Track Name",
      artists: ["Artist 1", "Artist 2"],
      genres: ["Genre 1", "Genre 2"],
      platforms: [
        {
          name: "spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "appleMusic",
          url: "https://example.com/apple-music",
        },
        {
          name: "youtube",
          url: "https://example.com/youtube",
        },
        {
          name: "soundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "amazonMusic",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "/images/me.png", // Example image URL
    },
    {
      id: 2,
      trackName: "Another Track",
      artists: ["Artist A", "Artist B"],
      genres: ["Genre A", "Genre B"],
      platforms: [
        {
          name: "spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "appleMusic",
          url: "https://example.com/apple-music",
        },
        {
          name: "youtube",
          url: "https://example.com/youtube",
        },
        {
          name: "soundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "amazonMusic",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "/images/me.png", // Example image URL
    },
    {
      id: 3,
      trackName: "Sample Track",
      artists: ["Sample Artist 1", "Sample Artist 2"],
      genres: ["Sample Genre 1", "Sample Genre 2"],
      platforms: [
        {
          name: "spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "appleMusic",
          url: "https://example.com/apple-music",
        },
        {
          name: "youtube",
          url: "https://example.com/youtube",
        },
        {
          name: "soundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "amazonMusic",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "/images/me.png", // Example image URL
    },
    {
      id: 4,
      trackName: "Demo Track",
      artists: ["Demo Artist 1", "Demo Artist 2"],
      genres: ["Demo Genre 1", "Demo Genre 2"],
      platforms: [
        {
          name: "spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "appleMusic",
          url: "https://example.com/apple-music",
        },
        {
          name: "youtube",
          url: "https://example.com/youtube",
        },
        {
          name: "soundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "amazonMusic",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "/images/me.png", // Example image URL
    },
    {
      id: 5,
      trackName: "Featured Track",
      artists: ["Featured Artist 1", "Featured Artist 2"],
      genres: ["Featured Genre 1", "Featured Genre 2"],
      platforms: [
        {
          name: "spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "appleMusic",
          url: "https://example.com/apple-music",
        },
        {
          name: "youtube",
          url: "https://example.com/youtube",
        },
        {
          name: "soundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "amazonMusic",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "/images/me.png", // Example image URL
    },
  ];
  const [hoveredWork, setHoveredWork] = useState<Work | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (work: Work) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setHoveredWork(work);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredWork(null);
    }, 600);
  };

  const handlePreviewMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handlePreviewMouseLeave = () => {
    setHoveredWork(null);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className={styles["container"]}>
      <div
        className={styles["preview"]}
        onMouseEnter={handlePreviewMouseEnter}
        onMouseLeave={handlePreviewMouseLeave}
      >
        <div className={styles["preview__image-container"]}>
          <ImageComp
            img="/images/back.png"
            alt={hoveredWork?.trackName || "Preview Image"}
            className={styles["preview__image"]}
          />
        </div>
        <div className={styles["preview__info"]}>
          <WordAnimation
            text={hoveredWork?.trackName || "Hover over a work"}
            className={styles["preview__track-name"]}
          />
          <div className={styles["preview__artists"]}>
            {hoveredWork?.artists.map((artist, index) => (
              <>
                <WordAnimation
                  key={index}
                  text={artist}
                  className={styles["preview__artist"]}
                  delayOffset={index * 0.1}
                />
                {index < hoveredWork.artists.length - 1 && (
                  // <span className={styles["preview__artist-separator"]}>•</span>
                  <WordAnimation
                    text="•"
                    className={styles["preview__artist-separator"]}
                    delayOffset={index * 0.1 + 0.2}
                  />
                )}
              </>
            ))}
          </div>
          <div className={styles["preview__genres"]}>
            {hoveredWork?.genres.map((genre, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={styles["preview__genre-container"]}
              >
                <WordAnimation
                  text={genre}
                  className={styles["preview__genre"]}
                  delayOffset={index * 0.1 + 0.5}
                />
              </motion.span>
            )) || ""}
          </div>
          <div className={styles["preview__platforms"]}>
            {hoveredWork?.platforms.map((platform, index) => {
              const PlatformIcon =
                Platform[platform.name as keyof typeof Platform];
              if (!PlatformIcon) return null; // Skip if the platform icon is not defined
              const IconComponent = PlatformIcon;

              return (
                <Link
                  key={index}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles["preview__platform"]}
                >
                  <IconComponent />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <ul className={styles["works"]}>
        <LetterAnimation text="Works" className={styles["works__title"]} />

        {works.map((work, index) => (
          <Link
            href={`/works/${work.id}`}
            key={index}
            className={styles["work"]}
            onMouseEnter={() => handleMouseEnter(work)}
            onMouseLeave={handleMouseLeave}
          >
            {hoveredWork?.id === work.id && (
              <motion.div className={styles["active"]} layoutId="work-active" />
            )}
            <div className={styles["work__header"]}>
              <WordAnimation
                text={work.trackName}
                className={styles["work__track-name"]}
              />
              <WordAnimation
                text={work.artists.join(" • ")}
                className={styles["work__artists"]}
              />
            </div>
          </Link>
        ))}
      </ul>
    </section>
  );
};

export default WorkSection;
