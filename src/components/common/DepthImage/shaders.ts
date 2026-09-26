// Warp-only port of the depth-parallax-test reference tool: same fixed-point
// inverse-warp math, with the ASCII/cell passes, lighting, normal maps, and
// view-switcher stripped out since this component only ever needs "just the
// depth" parallax. A `uCoverScale` term is added on top of the reference's
// math so the image can fill a Frame box of any aspect ratio (object-fit:
// cover) instead of the reference's own letterboxed-to-image-aspect canvas.

export const VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FS_WARP = `#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2  uShift;
uniform float uFocus;
uniform float uInvert;
uniform int   uSteps;
uniform float uBlur;
uniform vec2  uDepthTexel;
uniform vec2  uRange;
uniform float uOverscan;
uniform vec2  uCoverScale;
uniform float uZoom;
uniform vec2  uFocal;

float rawDepth(vec2 uv) {
  vec3 c = texture(uDepth, uv).rgb;
  float d = dot(c, vec3(0.2126, 0.7152, 0.0722));
  d = clamp((d - uRange.x) / max(uRange.y - uRange.x, 1e-4), 0.0, 1.0);
  return mix(d, 1.0 - d, uInvert);
}

// 3x3 tent blur, softening blocky/low-res depth maps so the displacement
// doesn't stair-step.
float depthAt(vec2 uv) {
  if (uBlur <= 0.001) return rawDepth(uv);
  vec2 r = uDepthTexel * uBlur;
  float s = rawDepth(uv) * 4.0;
  s += (rawDepth(uv + vec2( r.x, 0.0)) + rawDepth(uv + vec2(-r.x, 0.0))) * 2.0;
  s += (rawDepth(uv + vec2(0.0,  r.y)) + rawDepth(uv + vec2(0.0, -r.y))) * 2.0;
  s += rawDepth(uv + r) + rawDepth(uv - r);
  s += rawDepth(uv + vec2( r.x, -r.y)) + rawDepth(uv + vec2(-r.x, r.y));
  return s / 16.0;
}

void main() {
  // Cover-fit crop, re-centered on uFocal (like CSS object-position) and
  // scaled by uZoom on top of it. Overscan (separately) zooms in slightly so
  // the stretched border pixels the warp pulls in from off-image stay
  // outside the visible frame.
  //
  // uCoverScale is already the fraction of each axis that's visible at
  // zoom=1 (true cover-fit — the two axes are scaled together so the
  // sampled window's aspect ratio always matches the canvas's, which is
  // exactly what keeps circles circular). On whichever axis cover-fit had
  // zero slack (e.g. width, for a portrait photo in a landscape frame)
  // that fraction is already 1.0 — the max possible.
  //
  // uZoom only ever divides both axes by the SAME amount, so it's safe
  // (non-distorting) for zoom > 1 (uniformly cropping in further). For
  // zoom < 1 on a photo/frame pairing where one axis has no slack, do not
  // just clamp that axis back to 1.0 and leave the other divided — that
  // decouples the window's aspect ratio from the canvas's and visibly
  // squeezes/stretches the image. If a future use of this component needs
  // "zoom out" on an axis that's already maxed, that requires letterboxing
  // (showing less than full width/height) or a different crop strategy,
  // not this uniform-divide approach.
  vec2 scale = min(uCoverScale / (uOverscan * uZoom), vec2(1.0));
  vec2 base = (vUv - 0.5) * scale + uFocal;

  // Inverse warp has no closed form: solved by fixed-point iteration.
  // N=1 is the naive "offset by the depth under this pixel" version, which
  // smears at depth discontinuities; N=5..8 converges to clean occlusion
  // edges.
  vec2 uv = base;
  for (int i = 0; i < 16; i++) {
    if (i >= uSteps) break;
    uv = base + uShift * (depthAt(uv) - uFocus);
  }

  fragColor = vec4(texture(uColor, uv).rgb, 1.0);
}`;
