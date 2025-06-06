"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Image from "next/image";
import styles from "./styles.module.scss";
import clsx from "clsx";

export default function ImageComp({
  img = "/default-image.jpg",
  alt = "Parallax image",
  className,
}: {
  img?: string;
  alt?: string;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const isInView = useInView(ref, { once: true });

  const translateY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  return (
    <motion.div
      className={clsx(styles["image-container"], className)}
      ref={ref}
      initial={{ filter: "blur(30px)", opacity: 0, y: "10%" }}
      animate={
        isInView
          ? { filter: "blur(0px)", opacity: 1, y: "0%" }
          : { filter: "blur(30px)", opacity: 0, y: "10%" }
      }
      transition={{ duration: 1.4, ease: [0.56, 0, 0, 1] }}
    >
      <motion.div style={{ translateY: translateY }}>
        <Image
          src={img}
          alt={alt}
          fill
          style={{ objectFit: "cover" }}
          priority={false}
          quality={85}
        />
      </motion.div>
    </motion.div>
  );
}
