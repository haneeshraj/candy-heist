'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { VS, FS_WARP } from './shaders';
import type { DepthImageSettings } from './DepthImage.types';

interface UseDepthSceneOptions extends DepthImageSettings {
  colorSrc: string;
  depthSrc: string;
  interactive: boolean;
  frameZoom: number;
  focalX: number;
  focalY: number;
}

const IDLE_AFTER_MS = 1100;
const MAX_TEX_SIDE = 4096;

function fitForUpload(img: HTMLImageElement): TexImageSource {
  const side = Math.max(img.naturalWidth, img.naturalHeight);
  if (side <= MAX_TEX_SIDE) return img;

  const k = MAX_TEX_SIDE / side;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * k));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * k));
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`DepthImage: failed to load ${src}`));
    img.src = src;
  });
}

// Downsampled luminance min/max, used to normalize the depth map's contrast
// the same way the depth-parallax-test reference tool does.
function analyzeDepthRange(img: HTMLImageElement): [number, number] {
  const maxSide = 320;
  const k = Math.min(
    1,
    maxSide / Math.max(img.naturalWidth, img.naturalHeight)
  );
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(img.naturalHeight * k));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [0, 1];
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (l < min) min = l;
    if (l > max) max = l;
  }
  return [min / 255, max / 255];
}

export function useDepthScene(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseDepthSceneOptions
) {
  const [ready, setReady] = useState(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false
    });
    if (!gl) return undefined;

    let disposed = false;
    let rafId = 0;
    let colorAspect = 1;
    let depthRange: [number, number] = [0, 1];
    let depthTexel: [number, number] = [1, 1];

    function compile(type: number, src: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        const info = gl!.getShaderInfoLog(shader);
        gl!.deleteShader(shader);
        throw new Error(`DepthImage shader compile failed: ${info}`);
      }
      return shader;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FS_WARP));
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `DepthImage program link failed: ${gl.getProgramInfoLog(program)}`
      );
    }

    const uniformNames = [
      'uColor',
      'uDepth',
      'uShift',
      'uFocus',
      'uInvert',
      'uSteps',
      'uBlur',
      'uDepthTexel',
      'uRange',
      'uOverscan',
      'uCoverScale',
      'uZoom',
      'uFocal'
    ] as const;
    const u: Partial<
      Record<(typeof uniformNames)[number], WebGLUniformLocation | null>
    > = {};
    uniformNames.forEach((name) => {
      u[name] = gl.getUniformLocation(program, name);
    });

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const colorTex = gl.createTexture()!;
    const depthTex = gl.createTexture()!;

    function uploadTexture(tex: WebGLTexture, source: TexImageSource) {
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
      gl!.texImage2D(
        gl!.TEXTURE_2D,
        0,
        gl!.RGBA,
        gl!.RGBA,
        gl!.UNSIGNED_BYTE,
        source
      );
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      const mode = optionsRef.current.mirrorEdge
        ? gl!.MIRRORED_REPEAT
        : gl!.CLAMP_TO_EDGE;
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, mode);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, mode);
    }

    function draw(shiftX: number, shiftY: number) {
      const o = optionsRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas!.clientWidth || 1;
      const cssH = canvas!.clientHeight || 1;
      const bw = Math.max(1, Math.round(cssW * dpr));
      const bh = Math.max(1, Math.round(cssH * dpr));
      if (canvas!.width !== bw || canvas!.height !== bh) {
        canvas!.width = bw;
        canvas!.height = bh;
      }

      const canvasAspect = bw / bh;
      let scaleX = 1;
      let scaleY = 1;
      if (canvasAspect >= colorAspect) {
        scaleY = colorAspect / canvasAspect;
      } else {
        scaleX = canvasAspect / colorAspect;
      }

      gl!.viewport(0, 0, bw, bh);
      gl!.useProgram(program);

      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, colorTex);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, depthTex);

      gl!.uniform1i(u.uColor!, 0);
      gl!.uniform1i(u.uDepth!, 1);
      gl!.uniform2f(u.uShift!, shiftX, shiftY);
      gl!.uniform1f(u.uFocus!, o.focus);
      gl!.uniform1f(u.uInvert!, o.invertDepth ? 1 : 0);
      gl!.uniform1i(u.uSteps!, Math.min(16, o.steps | 0));
      gl!.uniform1f(u.uBlur!, o.blur);
      gl!.uniform2f(u.uDepthTexel!, depthTexel[0], depthTexel[1]);
      gl!.uniform2f(
        u.uRange!,
        o.normalize ? depthRange[0] : 0,
        o.normalize ? depthRange[1] : 1
      );
      gl!.uniform1f(u.uOverscan!, o.overscan);
      gl!.uniform2f(u.uCoverScale!, scaleX, scaleY);
      gl!.uniform1f(u.uZoom!, o.frameZoom);
      gl!.uniform2f(u.uFocal!, o.focalX, o.focalY);

      gl!.bindVertexArray(vao);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    const ptr = { tx: 0, ty: 0, x: 0, y: 0, lastMove: -1e9, inside: false };
    let orbitT = 0;
    let lastT = 0;

    function onPointerMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      ptr.tx = Math.max(-1.5, Math.min(1.5, nx * 2 - 1));
      ptr.ty = Math.max(-1.5, Math.min(1.5, ny * 2 - 1));
      ptr.lastMove = performance.now();
      ptr.inside = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
    }

    function onPointerLeave() {
      ptr.inside = false;
      if (!optionsRef.current.idleOn) {
        ptr.tx = 0;
        ptr.ty = 0;
      }
    }

    function shiftFor(px: number, py: number): [number, number] {
      const o = optionsRef.current;
      const sign = o.invertMotion ? -1 : 1;
      const amt = o.strength / 100;
      return [px * amt * sign, -py * amt * colorAspect * sign];
    }

    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.1) : 0.016;
      lastT = now;
      orbitT += dt;

      const o = optionsRef.current;
      let tx = ptr.tx;
      let ty = ptr.ty;
      if (o.idleOn && now - ptr.lastMove > IDLE_AFTER_MS) {
        tx = Math.cos(orbitT * 0.55) * o.idle;
        ty = Math.sin(orbitT * 0.79) * o.idle * 0.6;
      } else if (!ptr.inside && !o.idleOn) {
        tx = 0;
        ty = 0;
      }

      const tau = 0.015 + o.smooth * 0.6;
      const k = 1 - Math.exp(-dt / tau);
      ptr.x += (tx - ptr.x) * k;
      ptr.y += (ty - ptr.y) * k;

      const [shiftX, shiftY] = shiftFor(ptr.x, ptr.y);
      draw(shiftX, shiftY);
    }

    let resizeObserver: ResizeObserver | null = null;
    let cleanupInteractive: (() => void) | null = null;

    Promise.all([
      loadImage(options.colorSrc),
      loadImage(options.depthSrc)
    ]).then(([colorImg, depthImg]) => {
      if (disposed) return;

      colorAspect = colorImg.naturalWidth / colorImg.naturalHeight;
      depthTexel = [1 / depthImg.naturalWidth, 1 / depthImg.naturalHeight];
      depthRange = analyzeDepthRange(depthImg);

      uploadTexture(colorTex, fitForUpload(colorImg));
      uploadTexture(depthTex, fitForUpload(depthImg));

      setReady(true);

      resizeObserver = new ResizeObserver(() =>
        draw(...shiftFor(ptr.x, ptr.y))
      );
      resizeObserver.observe(canvas!);

      if (options.interactive) {
        canvas!.addEventListener('pointermove', onPointerMove);
        canvas!.addEventListener('pointerdown', onPointerMove);
        canvas!.addEventListener('pointerleave', onPointerLeave);
        rafId = requestAnimationFrame(tick);
        cleanupInteractive = () => {
          canvas!.removeEventListener('pointermove', onPointerMove);
          canvas!.removeEventListener('pointerdown', onPointerMove);
          canvas!.removeEventListener('pointerleave', onPointerLeave);
          cancelAnimationFrame(rafId);
        };
      } else {
        draw(0, 0);
      }
    });

    return () => {
      disposed = true;
      cleanupInteractive?.();
      resizeObserver?.disconnect();
      gl.deleteTexture(colorTex);
      gl.deleteTexture(depthTex);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
    // Only the structural inputs re-create the GL scene; tunable numeric
    // settings are read live from optionsRef so they never tear it down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.colorSrc, options.depthSrc, options.interactive]);

  return { ready };
}
