"use client";

import { useEffect } from "react";

const SmoothScroller = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    (async () => {
      const LocomotiveScroll = (await import("locomotive-scroll")).default;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const locomotiveScroll = new LocomotiveScroll({ smooth: true });
    })();
  }, []);

  return <>{children}</>;
};

export default SmoothScroller;
