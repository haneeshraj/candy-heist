// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  ABSENCE,
  FRAGMENTS,
  GRATICULE,
  GRATICULE_DENSE,
  INTERFERENCE,
  KIN,
  REDACTIONS,
  SIGIL,
  UNITY,
  VEINS
} from '@/components/common/NayaraPlanet/planetGeometry';
import {
  HEAVY_SHAPES,
  LAYER_TYPE_IDS,
  MAX_LAYERS,
  PLANET_R,
  PRESETS,
  blankPlanet,
  drawPlanet,
  evenList,
  newLayer,
  normalizeParams,
  parsePlanetSpec,
  presetFor,
  type DrawnLayer,
  type PresetState,
  type Shape
} from '.';

// The presets are the 11 looks the lore was designed with. Before planets
// could be edited they were drawn by hand-written code from the designs'
// generators (planetGeometry, still used by the About page); these tests
// hold the engine's presets to that drawing, shape for shape.

const r = PLANET_R;
const n4 = (n: number) => Math.round(n * 1e4) / 1e4;

const layerOf = (state: PresetState, id: string): DrawnLayer => {
  const layer = drawPlanet(presetFor(state).spec).layers.find(
    (l) => l.id === id
  );
  if (!layer) throw new Error(`${state} has no ${id} layer`);
  return layer;
};
const pathsOf = (shapes: Shape[]) =>
  shapes.map((shape) => (shape.t === 'path' ? shape.d : null));
const circlesOf = (shapes: Shape[]) =>
  shapes.map((shape) =>
    shape.t === 'circle' ? { x: shape.cx, y: shape.cy, r: shape.r } : null
  );
const rectsOf = (shapes: Shape[]) =>
  shapes.map((shape) =>
    shape.t === 'rect'
      ? { x: shape.x, y: shape.y, w: shape.w, h: shape.h }
      : null
  );
const rounded = (dots: Array<{ x: number; y: number; r: number }>) =>
  dots.map((dot) => ({ x: n4(dot.x), y: n4(dot.y), r: n4(dot.r) }));

const VEIN_OPACITY: Record<PresetState, number> = {
  network: 0.9,
  omun: 0.5,
  unity: 0.55,
  many: 0.3,
  disconnect: 0.4,
  sigil: 0.25,
  suppress: 0.42,
  order: 0,
  forget: 0.22,
  candy: 0.4,
  heist: 0.45
};

describe('the presets draw what the designs drew', () => {
  it('has all 11 looks', () => {
    expect(PRESETS.map((p) => p.state)).toEqual([
      'network',
      'omun',
      'unity',
      'many',
      'disconnect',
      'sigil',
      'suppress',
      'order',
      'forget',
      'candy',
      'heist'
    ]);
    expect(PRESETS.every((p) => p.id === `preset:${p.state}`)).toBe(true);
  });

  it.each(PRESETS.map((p) => p.state))('%s: the grid', (state) => {
    const grid = layerOf(state, 'grid');
    const [part] = grid.art.parts;
    expect(pathsOf(part.shapes)).toEqual([
      state === 'order' ? GRATICULE_DENSE : GRATICULE
    ]);
    expect(part.paint).toMatchObject({
      fill: 'none',
      stroke: '#b69e7c',
      strokeOpacity: state === 'order' ? 0.3 : 0.16,
      strokeWidth: 0.8
    });
  });

  it.each(PRESETS.map((p) => p.state).filter((s) => s !== 'order'))(
    '%s: the network',
    (state) => {
      const veins = layerOf(state, 'veins');
      const [part] = veins.art.parts;
      expect(pathsOf(part.shapes)).toEqual(VEINS);
      expect(part.paint).toMatchObject({
        fill: 'none',
        stroke: '#d2a961',
        strokeOpacity: VEIN_OPACITY[state],
        strokeWidth: state === 'network' ? 1.3 : 0.9,
        dash: state === 'disconnect' || state === 'forget' ? '4 5' : undefined,
        cap: 'round',
        join: 'round'
      });
    }
  );

  it('order has no network', () => {
    expect(drawPlanet(presetFor('order').spec).layers.map((l) => l.id)).toEqual(
      ['grid', 'core']
    );
  });

  it('unity: one line through nine beings', () => {
    const [line, beings] = layerOf('unity', 'beings').art.parts;
    expect(pathsOf(line.shapes)).toEqual([UNITY.line]);
    expect(line.paint).toMatchObject({
      stroke: '#d2a961',
      strokeOpacity: 0.8,
      strokeWidth: 1
    });
    expect(circlesOf(beings.shapes)).toEqual(rounded(UNITY.beings));
    expect(beings.paint).toMatchObject({ fill: '#d2a961', fillOpacity: 1 });
  });

  it('many: the lineages and their links', () => {
    const [links, dots] = layerOf('many', 'constellation').art.parts;
    expect(pathsOf(links.shapes)).toEqual([KIN.links]);
    expect(links.paint).toMatchObject({
      stroke: '#b69e7c',
      strokeOpacity: 0.35,
      strokeWidth: 0.7
    });
    expect(circlesOf(dots.shapes)).toEqual(rounded(KIN.lineages));
    expect(dots.paint).toMatchObject({ fill: '#d2a961', fillOpacity: 1 });
  });

  it('disconnect: the signal breaking up, bar for bar', () => {
    const { parts } = layerOf('disconnect', 'noise').art;
    const drawn = parts.flatMap((part) =>
      rectsOf(part.shapes).map((rect) => ({
        ...rect,
        gilt: part.paint.fill === '#d2a961'
      }))
    );
    expect(drawn).toEqual(INTERFERENCE);
    for (const part of parts) expect(part.paint.fillOpacity).toBe(0.55);
    expect(parts.find((part) => part.paint.fill === '#8a8071')).toBeDefined();
  });

  it('sigil: the star, its ring and its eye', () => {
    const [star, ring, eye] = layerOf('sigil', 'sigil').art.parts;
    expect(pathsOf(star.shapes)).toEqual([SIGIL.star]);
    expect(star.paint).toMatchObject({
      fill: 'none',
      stroke: '#d2a961',
      strokeWidth: 1.2
    });
    expect(circlesOf(ring.shapes)).toEqual([{ x: r, y: r, r: n4(SIGIL.ring) }]);
    expect(ring.paint.strokeOpacity).toBe(0.6);
    expect(circlesOf(eye.shapes)).toEqual([{ x: r, y: r, r: n4(SIGIL.eye) }]);
  });

  it('suppress: the redactions', () => {
    const [part] = layerOf('suppress', 'redactions').art.parts;
    expect(rectsOf(part.shapes)).toEqual(REDACTIONS);
    expect(part.paint).toMatchObject({ fill: '#2b2723', fillOpacity: 1 });
  });

  it('forget: the part gone, and its edge', () => {
    const [hole, edge] = layerOf('forget', 'missing').art.parts;
    expect(circlesOf(hole.shapes)).toEqual(rounded([ABSENCE]));
    expect(hole.paint).toMatchObject({ fill: '#111011', fillOpacity: 1 });
    expect(edge.paint).toMatchObject({
      fill: 'none',
      stroke: '#b69e7c',
      strokeOpacity: 0.25,
      dash: '2 5'
    });
  });

  it('candy: the crimson fragments', () => {
    const [part] = layerOf('candy', 'fragments').art.parts;
    expect(circlesOf(part.shapes)).toEqual(rounded(FRAGMENTS));
    expect(part.paint).toMatchObject({ fill: '#c4453a', fillOpacity: 0.9 });
  });

  it.each(PRESETS.map((p) => p.state))('%s: the core', (state) => {
    const core = layerOf(state, 'core');
    expect(core.aboveShade).toBe(true);
    const crimson = state === 'omun' || state === 'heist';
    const [dot, ring] = core.art.parts;
    expect(circlesOf(dot.shapes)).toEqual([
      { x: r, y: r, r: n4(r * (crimson ? 0.04 : 0.025)) }
    ]);
    expect(dot.paint.fill).toBe(crimson ? '#c4453a' : '#d2a961');
    if (state === 'heist') {
      expect(circlesOf(ring.shapes)).toEqual([{ x: r, y: r, r: n4(r * 0.11) }]);
      expect(ring.paint).toMatchObject({
        stroke: '#c4453a',
        strokeOpacity: 0.5,
        strokeWidth: 1
      });
    } else expect(ring).toBeUndefined();
  });

  it('keeps the planet the size it was: nothing reaches past the edge', () => {
    for (const preset of PRESETS) {
      const drawing = drawPlanet(preset.spec);
      expect(drawing.viewBox).toEqual([0, 0, 355, 355]);
      expect(drawing.discScale).toBe(1);
    }
  });
});

describe('every layer type', () => {
  it.each(LAYER_TYPE_IDS)(
    '%s draws with its defaults and a few seeds',
    (type) => {
      for (const seed of [1, 77, 123456]) {
        const spec = { ...blankPlanet(), layers: [newLayer(type, seed)] };
        const drawing = drawPlanet(spec);
        const [layer] = drawing.layers;
        const parts = [
          ...layer.art.parts,
          ...(layer.art.behind ?? []),
          ...(layer.art.front ?? [])
        ];
        expect(parts.length).toBeGreaterThan(0);
        for (const part of parts)
          for (const shape of part.shapes)
            for (const value of Object.values(shape))
              if (typeof value === 'number')
                expect(Number.isFinite(value)).toBe(true);
              else if (typeof value === 'string')
                expect(value).not.toMatch(/NaN|Infinity/);
      }
    }
  );

  it('is the same planet every time from the same seed', () => {
    for (const type of LAYER_TYPE_IDS) {
      const a = drawPlanet({ ...blankPlanet(), layers: [newLayer(type, 42)] });
      const b = drawPlanet({ ...blankPlanet(), layers: [newLayer(type, 42)] });
      expect(a.layers[0].art).toEqual(b.layers[0].art);
    }
  });
});

describe('the spec', () => {
  it('fills in a layer from its type', () => {
    const layer = newLayer('fragments', 5);
    expect(layer).toMatchObject({
      color: '#c4453a',
      opacity: 0.9,
      filled: true,
      dash: 'solid',
      visible: true,
      motion: { kind: 'none' }
    });
    expect(layer.params).toMatchObject({
      count: 26,
      shape: 'dot',
      place: 'everywhere'
    });
  });

  it('brings controls back into range rather than failing', () => {
    expect(
      normalizeParams('veins', {
        count: 400,
        wander: -3,
        depth: 2.6,
        nonsense: true
      })
    ).toMatchObject({ count: 24, wander: 0, depth: 3 });
    expect(normalizeParams('fragments', { shape: 'banana' }).shape).toBe('dot');
    expect(
      normalizeParams('grid', { meridians: [0.5, 'x', 7] }).meridians
    ).toEqual([0.5, 1]);
  });

  it('spreads a list evenly', () => {
    const grid = newLayer('grid', 1);
    expect(grid.params.meridians).toEqual([0.3, 0.64, 0.9]);
    expect(
      evenList(
        {
          kind: 'list',
          label: '',
          min: 0,
          max: 1,
          maxItems: 12,
          default: [],
          signed: false,
          spread: 0.9
        },
        3
      )
    ).toEqual([0.3, 0.6, 0.9]);
    expect(
      evenList(
        {
          kind: 'list',
          label: '',
          min: -1,
          max: 1,
          maxItems: 15,
          default: [],
          signed: true,
          spread: 0.8
        },
        4
      )
    ).toEqual([-0.6, -0.2, 0.2, 0.6]);
  });

  it('refuses more layers than a planet holds, and broken colours', () => {
    const layers = Array.from({ length: MAX_LAYERS + 1 }, (_, i) => ({
      id: `l${i}`,
      type: 'grid'
    }));
    expect(parsePlanetSpec({ layers }).success).toBe(false);
    expect(
      parsePlanetSpec({ layers: [{ id: 'a', type: 'grid', color: 'red' }] })
        .success
    ).toBe(false);
    expect(
      parsePlanetSpec({
        layers: [
          { id: 'a', type: 'grid' },
          { id: 'a', type: 'core' }
        ]
      }).success
    ).toBe(false);
    expect(
      parsePlanetSpec({ layers: [{ id: 'a', type: 'nope' }] }).success
    ).toBe(false);
  });

  it('grows the box for what reaches past the edge, so the planet draws smaller', () => {
    const ring = newLayer('ring', 3);
    const drawing = drawPlanet({ ...blankPlanet(), layers: [ring] });
    expect(drawing.viewBox[0]).toBeLessThan(0);
    expect(drawing.viewBox[2]).toBeGreaterThan(355);
    expect(drawing.discScale).toBeLessThan(1);
    expect(drawing.layers[0].art.behind?.length).toBeGreaterThan(0);
    expect(drawing.layers[0].art.front?.length).toBeGreaterThan(0);
  });

  it('counts how heavy a planet is', () => {
    const light = drawPlanet(presetFor('network').spec).shapes;
    expect(light).toBeLessThan(HEAVY_SHAPES);
    const halftone = newLayer('halftone', 1);
    const heavy = drawPlanet({
      ...blankPlanet(),
      layers: [{ ...halftone, params: { ...halftone.params, spacing: 4 } }]
    }).shapes;
    expect(heavy).toBeGreaterThan(HEAVY_SHAPES);
  });

  it('leaves a hidden layer out, and gives a moving one its centre', () => {
    const hidden = { ...newLayer('craters', 1), visible: false };
    const waves = newLayer('waves', 1);
    const moving = {
      ...waves,
      params: { ...waves.params, ox: 0.5 },
      motion: { kind: 'pulse' as const, seconds: 8, reverse: false }
    };
    const drawing = drawPlanet({ ...blankPlanet(), layers: [hidden, moving] });
    expect(drawing.layers.map((l) => l.id)).toEqual([moving.id]);
    expect(drawing.layers[0].motion?.origin).toEqual([r * 1.5, r]);
  });
});
