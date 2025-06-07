"use client";

import { useEffect } from "react";

const SmoothScroller = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Check if it's a mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;

    if (!isMobile) {
      (async () => {
        const LocomotiveScroll = (await import("locomotive-scroll")).default;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const locomotiveScroll = new LocomotiveScroll({ smooth: true });
      })();
    }
  }, []);

  return <>{children}</>;
};

export default SmoothScroller;
