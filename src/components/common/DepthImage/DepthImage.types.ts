export interface DepthImageSettings {
  /** Max pixel shift as % of image width. @default 4.3 */
  strength: number;
  /** Depth value that stays perfectly still; below it shifts one way, above the other. @default 0.5 */
  focus: number;
  /** Pointer easing time-constant input (0-0.97, higher = laggier). @default 0.86 */
  smooth: number;
  /** Idle auto-drift amount once the pointer leaves/settles. @default 0.35 */
  idle: number;
  /** Whether idle auto-drift runs at all. @default true */
  idleOn: boolean;
  /** Fixed-point refine iterations; 1 = naive offset, 5-8 = clean occlusion edges. @default 6 */
  steps: number;
  /** Depth softening radius in depth texels, hides blocky/low-res depth maps. @default 0.5 */
  blur: number;
  /** Zooms in slightly so warp-stretched border pixels stay off-screen. @default 1 */
  overscan: number;
  /** Flips which side of the focus plane is "near". @default false */
  invertDepth: boolean;
  /** Flips the direction of the parallax shift itself. @default false */
  invertMotion: boolean;
  /** Normalizes the depth map's min/max range before use. @default true */
  normalize: boolean;
  /** Mirrors instead of clamping at the texture edges. @default false */
  mirrorEdge: boolean;
}

/** The hand-tuned "saved" look carried over from the depth-parallax-test reference tool, minus its ASCII-only settings. */
export const DEPTH_IMAGE_SAVED_PRESET: DepthImageSettings = {
  strength: 4.3,
  focus: 0.5,
  smooth: 0.86,
  idle: 0.35,
  idleOn: true,
  steps: 6,
  blur: 0.5,
  overscan: 1,
  invertDepth: false,
  invertMotion: false,
  normalize: true,
  mirrorEdge: false
};

export interface DepthImageProps extends Partial<DepthImageSettings> {
  /** RGB source image. */
  colorSrc: string;
  /** Grayscale depth map, same crop/aspect as colorSrc. */
  depthSrc: string;
  className?: string;
  /**
   * When false, skips WebGL entirely — no context, no shader compile, no
   * texture uploads, no depth-map fetch — and shows colorSrc as a plain
   * cover-fit background image instead. Used to fully disable the effect on
   * touch devices (phones, tablets), where there's no pointer to drive it
   * and the GPU/memory cost isn't worth paying. Independent of `interactive`,
   * which only matters once this is true.
   * @default true
   */
  enabled?: boolean;
  /**
   * When false, renders a single static frame at the focus position and
   * never starts an animation loop or attaches pointer listeners — used for
   * prefers-reduced-motion, where there's no cursor to drive the effect and
   * running WebGL continuously would just burn battery.
   * @default true
   */
  interactive?: boolean;
  /**
   * Extra zoom applied on top of the automatic object-fit:cover crop — a
   * compositional choice (how much of the photo to show), independent of
   * the depth-parallax tuning above. Only safe for values >= 1 (uniformly
   * cropping in further): going below 1 divides both axes by the same
   * amount, and whichever axis cover-fit already had at its 100%-visible
   * maximum (e.g. width, for a portrait photo in a landscape frame) gets
   * clamped back — decoupling it from the other axis and visibly
   * squeezing/stretching the image. Use `focalX`/`focalY` to reposition
   * the crop instead of zooming out below 1.
   * @default 1
   */
  frameZoom?: number;
  /** Horizontal focal point (0-1) for the crop window, like CSS object-position. @default 0.5 */
  focalX?: number;
  /** Vertical focal point (0-1) for the crop window, like CSS object-position. @default 0.5 */
  focalY?: number;
}
