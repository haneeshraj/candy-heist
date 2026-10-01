import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  EllipseCurve,
  ExtrudeGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

// The 404's scene: the vortex mark extruded into solid gold, turning in a
// slow galaxy of gold dust that spirals the way the mark does, with three
// faint orbits and far stars behind. It swings in from edge-on, then
// keeps turning; the pointer tilts the whole of it a little. Reduced
// motion gets one still frame. Built only on the client, from the brand
// SVG, so the mark stays the one file.

export interface VortexScene {
  dispose: () => void;
}

interface Options {
  reduced: boolean;
  onReady: () => void;
}

const GILT = new Color('#d2a961');
const CREAM = new Color('#ddcfb2');
const CRIMSON = new Color('#c4453a');

/** A soft round dot, so the dust isn't drawn as squares. */
function dotTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// Gaussian-ish noise, for the scatter round each arm.
const noise = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/** Two spiral arms of dust, the vortex's own turn, flat in a disc. */
function galaxy(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const arm = i % 2;
    const r = 1.1 + Math.pow(Math.random(), 0.7) * 5.4;
    const angle = arm * Math.PI + r * 1.05 + noise() * (0.25 + r * 0.04);
    positions.set(
      [Math.cos(angle) * r, noise() * (0.08 + r * 0.025), Math.sin(angle) * r],
      i * 3
    );
    const c =
      Math.random() < 0.04
        ? CRIMSON
        : GILT.clone().lerp(CREAM, Math.random() * 0.6);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

/** Far stars on a shell well behind everything. */
function farStars(count: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = 26 + Math.random() * 24;
    const s = Math.sqrt(1 - u * u);
    positions.set(
      [Math.cos(theta) * s * r, u * r, Math.sin(theta) * s * r - 12],
      i * 3
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return geometry;
}

function orbit(radius: number) {
  const points = new EllipseCurve(
    0,
    0,
    radius,
    radius,
    0,
    Math.PI * 2
  ).getPoints(160);
  return new BufferGeometry().setFromPoints(
    points.map((p) => new Vector3(p.x, 0, p.y))
  );
}

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 3);

export function createVortexScene(
  canvas: HTMLCanvasElement,
  svg: string,
  { reduced, onReady }: Options
): VortexScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 120);
  camera.position.set(0, 0, 9);

  // Reflections from a soft studio, so the gold reads as metal.
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  scene.add(new AmbientLight(0x2a1d10, 0.8));
  const key = new DirectionalLight(0xfff0d2, 2.4);
  key.position.set(3, 4, 6);
  const rim = new DirectionalLight(CRIMSON, 1.6);
  rim.position.set(-5, -1.5, -4);
  scene.add(key, rim);

  // The mark: the SVG's shapes, extruded and bevelled, centred, and turned
  // the right way up (SVG's y runs down).
  const shapes = new SVGLoader()
    .parse(svg)
    .paths.flatMap((path) => path.toShapes());
  const logoGeometry = new ExtrudeGeometry(shapes, {
    depth: 34,
    bevelEnabled: true,
    bevelThickness: 7,
    bevelSize: 4.5,
    bevelSegments: 8,
    curveSegments: 40
  });
  logoGeometry.center();
  const gold = new MeshPhysicalMaterial({
    color: 0xc4913a,
    metalness: 1,
    roughness: 0.26,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.85
  });
  const logo = new Mesh(logoGeometry, gold);
  const unit = 2.6 / 414.64;
  logo.scale.set(unit, -unit, unit);
  const spinner = new Group();
  spinner.add(logo);
  const stage = new Group();
  stage.add(spinner);
  scene.add(stage);

  // The dust and the orbits share a disc, tipped towards the viewer.
  const dot = dotTexture();
  const disc = new Group();
  disc.rotation.set(-1.08, 0, 0.22);
  const dustGeometry = galaxy(6000);
  const dust = new Points(
    dustGeometry,
    new PointsMaterial({
      size: 0.055,
      map: dot,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true
    })
  );
  disc.add(dust);
  const orbitMaterial = new LineBasicMaterial({
    color: GILT,
    transparent: true,
    opacity: 0
  });
  const orbits = [2.3, 3.2, 4.6].map((radius, i) => {
    const line = new LineLoop(orbit(radius), orbitMaterial);
    line.rotation.set(i * 0.12, 0, i * -0.08);
    disc.add(line);
    return line;
  });
  stage.add(disc);
  const starsGeometry = farStars(900);
  const stars = new Points(
    starsGeometry,
    new PointsMaterial({
      size: 0.12,
      map: dot,
      color: CREAM,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    })
  );
  scene.add(stars);

  // Fit to the box: a narrow screen steps the camera back.
  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z =
      camera.aspect < 1 ? 9 / Math.max(camera.aspect, 0.55) : 9;
    camera.updateProjectionMatrix();
    // The mark sits above the middle, clear of the words at the foot.
    stage.position.y = camera.aspect < 1 ? 1.7 : 0.95;
  }
  // A still frame has to be drawn again after each resize.
  const observer = new ResizeObserver(() => {
    resize();
    if (reduced) still();
  });
  observer.observe(canvas);
  resize();

  // The pointer tilts the stage, eased.
  const pointer = { x: 0, y: 0 };
  function onPointer(event: PointerEvent) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  }

  const timer = new Timer();
  let spin = 0;
  function frame(time: number) {
    timer.update(time);
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();
    const intro = easeOut(t / 2.4);
    // Swings in from edge-on, fast, settling to a steady turn.
    spin += dt * (0.45 + (1 - intro) * 3.2);
    spinner.rotation.y = spin - (Math.PI / 2) * (1 - intro);
    spinner.position.y = Math.sin(t * 0.8) * 0.06;
    spinner.scale.setScalar(0.75 + 0.25 * intro);
    dust.rotation.y = -t * 0.035;
    orbits.forEach(
      (o, i) => (o.rotation.y = t * (0.02 + i * 0.012) * (i % 2 ? -1 : 1))
    );
    (dust.material as PointsMaterial).opacity = 0.9 * easeOut((t - 0.3) / 2);
    orbitMaterial.opacity = 0.22 * easeOut((t - 0.8) / 2);
    stars.rotation.y = t * 0.004;
    stage.rotation.x += (pointer.y * 0.18 - stage.rotation.x) * 0.04;
    stage.rotation.y += (pointer.x * 0.28 - stage.rotation.y) * 0.04;
    renderer.render(scene, camera);
  }

  function still() {
    spinner.rotation.y = -0.55;
    (dust.material as PointsMaterial).opacity = 0.9;
    orbitMaterial.opacity = 0.22;
    renderer.render(scene, camera);
  }

  function onVisibility() {
    renderer.setAnimationLoop(document.hidden || reduced ? null : frame);
  }

  if (reduced) still();
  else {
    renderer.setAnimationLoop(frame);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
  }
  onReady();

  return {
    dispose() {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const geometry of [
        logoGeometry,
        dustGeometry,
        starsGeometry,
        ...orbits.map((o) => o.geometry)
      ])
        geometry.dispose();
      for (const material of [
        gold,
        dust.material as PointsMaterial,
        orbitMaterial,
        stars.material as PointsMaterial
      ])
        material.dispose();
      dot.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    }
  };
}
