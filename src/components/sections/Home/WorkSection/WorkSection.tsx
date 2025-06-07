"use client";

import { useState } from "react";
import { motion } from "motion/react";

import styles from "./styles.module.scss";
import LetterAnimation from "@/components/LetterAnimation/LetterAnimation";
import Image from "next/image";
import WordAnimation from "@/components/WordAnimation/WordAnimation";
import Link from "next/link";

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
          name: "Spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "Apple Music",
          url: "https://example.com/apple-music",
        },
        {
          name: "YouTube",
          url: "https://example.com/youtube",
        },
        {
          name: "SoundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "Amazon Music",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "https://placehold.co/600x400", // Example image URL
    },
    {
      id: 2,
      trackName: "Another Track",
      artists: ["Artist A", "Artist B"],
      genres: ["Genre A", "Genre B"],
      platforms: [
        {
          name: "Spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "Apple Music",
          url: "https://example.com/apple-music",
        },
        {
          name: "YouTube",
          url: "https://example.com/youtube",
        },
        {
          name: "SoundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "Amazon Music",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "https://placehold.co/600x400", // Example image URL
    },
    {
      id: 3,
      trackName: "Sample Track",
      artists: ["Sample Artist 1", "Sample Artist 2"],
      genres: ["Sample Genre 1", "Sample Genre 2"],
      platforms: [
        {
          name: "Spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "Apple Music",
          url: "https://example.com/apple-music",
        },
        {
          name: "YouTube",
          url: "https://example.com/youtube",
        },
        {
          name: "SoundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "Amazon Music",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "https://placehold.co/600x400", // Example image URL
    },
    {
      id: 4,
      trackName: "Demo Track",
      artists: ["Demo Artist 1", "Demo Artist 2"],
      genres: ["Demo Genre 1", "Demo Genre 2"],
      platforms: [
        {
          name: "Spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "Apple Music",
          url: "https://example.com/apple-music",
        },
        {
          name: "YouTube",
          url: "https://example.com/youtube",
        },
        {
          name: "SoundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "Amazon Music",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "https://placehold.co/600x400", // Example image URL
    },
    {
      id: 5,
      trackName: "Featured Track",
      artists: ["Featured Artist 1", "Featured Artist 2"],
      genres: ["Featured Genre 1", "Featured Genre 2"],
      platforms: [
        {
          name: "Spotify",
          url: "https://example.com/spotify",
        },
        {
          name: "Apple Music",
          url: "https://example.com/apple-music",
        },
        {
          name: "YouTube",
          url: "https://example.com/youtube",
        },
        {
          name: "SoundCloud",
          url: "https://example.com/soundcloud",
        },
        {
          name: "Amazon Music",
          url: "https://example.com/amazon-music",
        },
      ],
      image: "https://placehold.co/600x400", // Example image URL
    },
  ];
  const [hoveredWork, setHoveredWork] = useState<Work | null>(null);

  return (
    <section className={styles["container"]}>
      <div className={styles["preview"]}>
        <div className={styles["preview__image-container"]}>
          <Image
            src={hoveredWork?.image || "https://placehold.co/600x400"}
            alt={hoveredWork?.trackName || "Preview Image"}
            width={600}
            height={400}
            className={styles["preview__image"]}
          />
        </div>
        <div className={styles["preview__info"]}>
          <h2 className={styles["preview__track-name"]}>
            {hoveredWork?.trackName || "Hover over a work"}
          </h2>
          <p className={styles["preview__artists"]}>
            {hoveredWork?.artists.join(", ") || "Artists"}
          </p>
          <div className={styles["preview__platforms"]}>
            {hoveredWork?.platforms.map((platform, index) => (
              <Link
                key={index}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles["preview__platform"]}
              >
                {platform.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <ul className={styles["works"]}>
        <LetterAnimation text="Works" className={styles["works__title"]} />

        {works.map((work, index) => (
          <li
            key={index}
            className={styles["work"]}
            onMouseEnter={() => {
              setHoveredWork(work);
            }}
            onMouseLeave={() => setHoveredWork(null)}
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
                text={work.artists.join(" . ")}
                className={styles["work__artists"]}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default WorkSection;
