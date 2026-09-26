export const BREAKPOINT_TABLET = 768;
export const BREAKPOINT_DESKTOP = 1024;

// Frame's scroll-parallax and DepthImage's pointer-warp are both desktop /
// fine-pointer enhancements; touch devices get the static, framed image.
export const DESKTOP_QUERY = `(min-width: ${BREAKPOINT_DESKTOP}px)`;
export const FINE_POINTER_QUERY = '(pointer: fine) and (hover: hover)';
