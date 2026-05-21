import {
  Box,
  Button,
  ColorSelector,
  FormField,
  Grid,
  PlusIcon,
  Rows,
  SegmentedControl,
  Slider,
  Switch,
  Text,
  TextInput,
  Title,
  TrashIcon,
} from "@canva/app-ui-kit";
import { upload } from "@canva/asset";
import { addElementAtCursor, addElementAtPoint } from "@canva/design";
import { useFeatureSupport } from "@canva/app-hooks";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as styles from "styles/components.css";

type Mode = "linear" | "radial" | "conic" | "spots";
type BlendMode = "source-over" | "multiply" | "screen" | "overlay";
type Stop = { id: string; color: string; position: number };
type Spot = {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  opacity: number;
};

type GradientPreset = {
  name: string;
  stops: { color: string; position: number }[];
};

type SpotsPreset = {
  name: string;
  base: string;
  spots: Omit<Spot, "id">[];
};

type CustomPreset = {
  id: string;
  name: string;
  mode: Mode;
  stops?: { color: string; position: number }[];
  baseColor?: string;
  spots?: Omit<Spot, "id">[];
  angle?: number;
  center?: { x: number; y: number };
  blendMode?: BlendMode;
  vignette?: number;
};

const STORAGE_KEY = "vintage-gradient.customPresets.v1";

const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: "Sunset Burn",
    stops: [
      { color: "#f4a261", position: 0 },
      { color: "#6d2e46", position: 100 },
    ],
  },
  {
    name: "Risograph",
    stops: [
      { color: "#f7cad0", position: 0 },
      { color: "#843b62", position: 100 },
    ],
  },
  {
    name: "Polaroid",
    stops: [
      { color: "#f3e5d8", position: 0 },
      { color: "#9a8c98", position: 100 },
    ],
  },
  {
    name: "Dusty Teal",
    stops: [
      { color: "#cad2c5", position: 0 },
      { color: "#2f3e46", position: 100 },
    ],
  },
  {
    name: "Sepia Dream",
    stops: [
      { color: "#e8d4b6", position: 0 },
      { color: "#8b5a3c", position: 100 },
    ],
  },
  {
    name: "70s Sun",
    stops: [
      { color: "#ffe66d", position: 0 },
      { color: "#ff6b6b", position: 50 },
      { color: "#6d2e46", position: 100 },
    ],
  },
  {
    name: "Miami",
    stops: [
      { color: "#ffd1dc", position: 0 },
      { color: "#ff77a9", position: 35 },
      { color: "#6c5ce7", position: 75 },
      { color: "#2d3561", position: 100 },
    ],
  },
  {
    name: "Faded Film",
    stops: [
      { color: "#fff8e7", position: 0 },
      { color: "#e8c4a0", position: 30 },
      { color: "#a3756a", position: 65 },
      { color: "#3d2b3d", position: 100 },
    ],
  },
];

const SPOTS_PRESETS: SpotsPreset[] = [
  {
    name: "Magazine Burn",
    base: "#1a0e1a",
    spots: [
      { x: 0.25, y: 0.3, color: "#ff6b35", radius: 0.45, opacity: 1 },
      { x: 0.75, y: 0.6, color: "#ffd166", radius: 0.4, opacity: 1 },
      { x: 0.5, y: 0.85, color: "#c1121f", radius: 0.35, opacity: 1 },
    ],
  },
  {
    name: "Aurora",
    base: "#0a0e2a",
    spots: [
      { x: 0.2, y: 0.7, color: "#06d6a0", radius: 0.5, opacity: 1 },
      { x: 0.6, y: 0.3, color: "#7b2cbf", radius: 0.45, opacity: 1 },
      { x: 0.85, y: 0.75, color: "#ff006e", radius: 0.4, opacity: 1 },
    ],
  },
  {
    name: "Risograph Spot",
    base: "#fdf0d5",
    spots: [
      { x: 0.3, y: 0.4, color: "#ef476f", radius: 0.5, opacity: 1 },
      { x: 0.7, y: 0.65, color: "#118ab2", radius: 0.45, opacity: 1 },
    ],
  },
  {
    name: "Halftone Sun",
    base: "#fff3b0",
    spots: [
      { x: 0.5, y: 0.5, color: "#e09f3e", radius: 0.55, opacity: 1 },
      { x: 0.2, y: 0.2, color: "#9e2a2b", radius: 0.3, opacity: 1 },
      { x: 0.8, y: 0.8, color: "#9e2a2b", radius: 0.3, opacity: 1 },
    ],
  },
];

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1", w: 1080, h: 1080 },
  { label: "16:9", value: "16:9", w: 1920, h: 1080 },
  { label: "9:16", value: "9:16", w: 1080, h: 1920 },
  { label: "4:5", value: "4:5", w: 1080, h: 1350 },
] as const;
type Ratio = (typeof ASPECT_RATIOS)[number]["value"];

const BLEND_OPTIONS: { label: string; value: BlendMode }[] = [
  { label: "Normal", value: "source-over" },
  { label: "Multiply", value: "multiply" },
  { label: "Screen", value: "screen" },
  { label: "Overlay", value: "overlay" },
];

const PREVIEW_MAX = 320;

type RenderOpts = {
  mode: Mode;
  stops: Stop[];
  angle: number;
  center: { x: number; y: number };
  baseColor: string;
  spots: Spot[];
  blendMode: BlendMode;
  vignette: number;
  noise: number;
  grainSize: number;
  colorNoise: boolean;
  seed: number;
  /** Multiplier applied to the grain block size — keeps grain visually consistent across export scales. */
  scale?: number;
};

// --- color helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const h =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number) {
  const c = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mixHex(a: string, b: string) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex((ar + br) / 2, (ag + bg) / 2, (ab + bb) / 2);
}

function hexToRgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp255(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// --- renderer ---

function renderGradient(canvas: HTMLCanvasElement, opts: RenderOpts) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const w = canvas.width;
  const h = canvas.height;

  ctx.globalCompositeOperation = "source-over";

  if (opts.mode === "spots") {
    ctx.fillStyle = opts.baseColor;
    ctx.fillRect(0, 0, w, h);
    const diag = Math.hypot(w, h);
    for (const spot of opts.spots) {
      const cx = spot.x * w;
      const cy = spot.y * h;
      const r = Math.max(1, spot.radius * diag * 0.5);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, hexToRgba(spot.color, spot.opacity));
      grad.addColorStop(0.6, hexToRgba(spot.color, spot.opacity * 0.55));
      grad.addColorStop(1, hexToRgba(spot.color, 0));
      ctx.globalCompositeOperation = opts.blendMode;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";
  } else {
    let gradient: CanvasGradient;
    if (opts.mode === "linear") {
      const rad = (opts.angle * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const cx = w / 2;
      const cy = h / 2;
      const half = Math.abs(w * dx) / 2 + Math.abs(h * dy) / 2;
      gradient = ctx.createLinearGradient(
        cx - dx * half,
        cy - dy * half,
        cx + dx * half,
        cy + dy * half,
      );
    } else if (opts.mode === "radial") {
      const cx = opts.center.x * w;
      const cy = opts.center.y * h;
      const r = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(w - cx, cy),
        Math.hypot(cx, h - cy),
        Math.hypot(w - cx, h - cy),
      );
      gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    } else {
      // conic
      const cx = opts.center.x * w;
      const cy = opts.center.y * h;
      const startAngle = ((opts.angle - 90) * Math.PI) / 180;
      gradient = ctx.createConicGradient(startAngle, cx, cy);
    }
    const sorted = [...opts.stops].sort((a, b) => a.position - b.position);
    for (const s of sorted) {
      const p = Math.max(0, Math.min(1, s.position / 100));
      gradient.addColorStop(p, s.color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  // Vignette pass
  if (opts.vignette > 0) {
    const v = opts.vignette / 100;
    const innerR = Math.min(w, h) * 0.3;
    const outerR = Math.hypot(w, h) / 2;
    const vg = ctx.createRadialGradient(w / 2, h / 2, innerR, w / 2, h / 2, outerR);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, `rgba(0,0,0,${v * 0.85})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  // Grain pass
  if (opts.noise > 0) {
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const amp = (opts.noise / 100) * 90;
    const block = Math.max(
      1,
      Math.floor(opts.grainSize * (opts.scale ?? 1)),
    );
    const rand = mulberry32(opts.seed);
    for (let y = 0; y < h; y += block) {
      const ymax = Math.min(y + block, h);
      for (let x = 0; x < w; x += block) {
        const xmax = Math.min(x + block, w);
        let nr: number;
        let ng: number;
        let nb: number;
        if (opts.colorNoise) {
          nr = (rand() - 0.5) * 2 * amp;
          ng = (rand() - 0.5) * 2 * amp;
          nb = (rand() - 0.5) * 2 * amp;
        } else {
          const n = (rand() - 0.5) * 2 * amp;
          nr = n;
          ng = n;
          nb = n;
        }
        for (let yy = y; yy < ymax; yy++) {
          const rowOffset = yy * w * 4;
          for (let xx = x; xx < xmax; xx++) {
            const i = rowOffset + xx * 4;
            data[i] = clamp255(data[i]! + nr);
            data[i + 1] = clamp255(data[i + 1]! + ng);
            data[i + 2] = clamp255(data[i + 2]! + nb);
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }
}

function drawMarkers(
  canvas: HTMLCanvasElement,
  points: { id: string; x: number; y: number }[],
  selectedId: string | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const w = canvas.width;
  const h = canvas.height;
  for (const p of points) {
    const x = p.x * w;
    const y = p.y * h;
    const isSel = p.id === selectedId;
    const r = isSel ? 10 : 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isSel ? "#111" : "rgba(0,0,0,0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

function applyGradientPreset(p: GradientPreset): Stop[] {
  return p.stops.map((s) => ({ ...s, id: newId() }));
}

function applySpotsPreset(p: SpotsPreset): Spot[] {
  return p.spots.map((s) => ({ ...s, id: newId() }));
}

function loadCustomPresets(): CustomPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: CustomPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export const App = () => {
  const isSupported = useFeatureSupport();
  const addElement = [addElementAtPoint, addElementAtCursor].find((fn) =>
    isSupported(fn),
  );

  const previewRef = useRef<HTMLCanvasElement>(null);
  const exportRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<Mode>("linear");
  const [stops, setStops] = useState<Stop[]>(() =>
    applyGradientPreset(GRADIENT_PRESETS[0]!),
  );
  const [angle, setAngle] = useState(135);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [baseColor, setBaseColor] = useState(SPOTS_PRESETS[0]!.base);
  const [spots, setSpots] = useState<Spot[]>(() =>
    applySpotsPreset(SPOTS_PRESETS[0]!),
  );
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [blendMode, setBlendMode] = useState<BlendMode>("source-over");
  const [vignette, setVignette] = useState(0);
  const [noise, setNoise] = useState(40);
  const [grainSize, setGrainSize] = useState(1);
  const [colorNoise, setColorNoise] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [ratio, setRatio] = useState<Ratio>("1:1");
  const [exportHiRes, setExportHiRes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() =>
    loadCustomPresets(),
  );
  const [savingName, setSavingName] = useState<string | null>(null);

  const exportSize = useMemo(
    () => ASPECT_RATIOS.find((r) => r.value === ratio)!,
    [ratio],
  );

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops],
  );

  const previewSize = useMemo(() => {
    const aspect = exportSize.w / exportSize.h;
    if (aspect >= 1) {
      return { w: PREVIEW_MAX, h: Math.round(PREVIEW_MAX / aspect) };
    }
    return { w: Math.round(PREVIEW_MAX * aspect), h: PREVIEW_MAX };
  }, [exportSize]);

  const renderOpts = useMemo<RenderOpts>(
    () => ({
      mode,
      stops,
      angle,
      center,
      baseColor,
      spots,
      blendMode,
      vignette,
      noise,
      grainSize,
      colorNoise,
      seed,
    }),
    [
      mode,
      stops,
      angle,
      center,
      baseColor,
      spots,
      blendMode,
      vignette,
      noise,
      grainSize,
      colorNoise,
      seed,
    ],
  );

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = previewSize.w;
    canvas.height = previewSize.h;
    renderGradient(canvas, renderOpts);

    if (mode === "radial" || mode === "conic") {
      drawMarkers(canvas, [{ id: "center", x: center.x, y: center.y }], "center");
    } else if (mode === "spots") {
      drawMarkers(canvas, spots, selectedSpotId);
    }
  }, [renderOpts, previewSize, mode, center, spots, selectedSpotId]);

  // --- pointer interactions ---

  const getNormalizedPos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      rect,
    };
  };

  const onPreviewPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode === "linear") {
      return;
    }
    const { x, y, rect } = getNormalizedPos(e);
    const HIT_RADIUS_PX = 16;

    if (mode === "radial" || mode === "conic") {
      setCenter({ x, y });
      setDragId("center");
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    let hit: Spot | null = null;
    for (const s of spots) {
      const dx = (s.x - x) * rect.width;
      const dy = (s.y - y) * rect.height;
      if (Math.hypot(dx, dy) < HIT_RADIUS_PX) {
        hit = s;
        break;
      }
    }
    if (hit) {
      setSelectedSpotId(hit.id);
      setDragId(hit.id);
    } else {
      const fallbackColor =
        spots.find((s) => s.id === selectedSpotId)?.color ?? "#ff8c69";
      const id = newId();
      setSpots((prev) => [
        ...prev,
        { id, x, y, color: fallbackColor, radius: 0.35, opacity: 1 },
      ]);
      setSelectedSpotId(id);
      setDragId(id);
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPreviewPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragId) {
      return;
    }
    const { x, y } = getNormalizedPos(e);
    if (mode === "radial" || mode === "conic") {
      setCenter({ x, y });
    } else if (mode === "spots") {
      setSpots((prev) =>
        prev.map((s) => (s.id === dragId ? { ...s, x, y } : s)),
      );
    }
  };

  const onPreviewPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDragId(null);
    }
  };

  // --- stop helpers ---

  const updateStop = useCallback((id: string, patch: Partial<Stop>) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }, []);

  const removeStop = useCallback((id: string) => {
    setStops((prev) =>
      prev.length > 2 ? prev.filter((s) => s.id !== id) : prev,
    );
  }, []);

  const addStop = useCallback(() => {
    setStops((prev) => {
      const sorted = [...prev].sort((a, b) => a.position - b.position);
      let bestGap = -1;
      let insertPos = 50;
      let insertColor = "#888888";
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i]!;
        const b = sorted[i + 1]!;
        const gap = b.position - a.position;
        if (gap > bestGap) {
          bestGap = gap;
          insertPos = (a.position + b.position) / 2;
          insertColor = mixHex(a.color, b.color);
        }
      }
      return [
        ...prev,
        { id: newId(), color: insertColor, position: insertPos },
      ];
    });
  }, []);

  // --- spot helpers ---

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;

  const updateSpot = useCallback((id: string, patch: Partial<Spot>) => {
    setSpots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeSpot = useCallback(
    (id: string) => {
      setSpots((prev) => prev.filter((s) => s.id !== id));
      if (selectedSpotId === id) {
        setSelectedSpotId(null);
      }
    },
    [selectedSpotId],
  );

  // --- preset application ---

  const applyGradient = (p: GradientPreset) => {
    setStops(applyGradientPreset(p));
  };

  const applySpots = (p: SpotsPreset) => {
    setBaseColor(p.base);
    setSpots(applySpotsPreset(p));
    setSelectedSpotId(null);
  };

  const applyCustom = (p: CustomPreset) => {
    setMode(p.mode);
    if (p.angle != null) {
      setAngle(p.angle);
    }
    if (p.center) {
      setCenter(p.center);
    }
    if (p.blendMode) {
      setBlendMode(p.blendMode);
    }
    if (p.vignette != null) {
      setVignette(p.vignette);
    }
    if (p.stops) {
      setStops(p.stops.map((s) => ({ ...s, id: newId() })));
    }
    if (p.baseColor) {
      setBaseColor(p.baseColor);
    }
    if (p.spots) {
      setSpots(p.spots.map((s) => ({ ...s, id: newId() })));
      setSelectedSpotId(null);
    }
  };

  const commitSave = () => {
    if (savingName == null) {
      return;
    }
    const name =
      savingName.trim().slice(0, 40) || `Preset ${customPresets.length + 1}`;
    const snapshot: CustomPreset = {
      id: newId(),
      name,
      mode,
      angle,
      center,
      blendMode,
      vignette,
    };
    if (mode === "spots") {
      snapshot.baseColor = baseColor;
      snapshot.spots = spots.map(({ id: _ignored, ...rest }) => rest);
    } else {
      snapshot.stops = stops.map(({ id: _ignored, ...rest }) => rest);
    }
    const next = [...customPresets, snapshot];
    setCustomPresets(next);
    saveCustomPresets(next);
    setSavingName(null);
  };

  const deleteCustom = (id: string) => {
    const next = customPresets.filter((p) => p.id !== id);
    setCustomPresets(next);
    saveCustomPresets(next);
  };

  // --- export ---

  const onAdd = useCallback(async () => {
    if (!addElement || !exportRef.current) {
      return;
    }
    setIsLoading(true);
    // Yield so React commits the loading state before we block the thread.
    await new Promise((r) => setTimeout(r, 0));
    try {
      const canvas = exportRef.current;
      const scale = exportHiRes ? 2 : 1;
      canvas.width = exportSize.w * scale;
      canvas.height = exportSize.h * scale;
      renderGradient(canvas, { ...renderOpts, scale });
      // Yield again before the (still synchronous) blob encoding step.
      await new Promise((r) => setTimeout(r, 0));
      const dataUrl = await canvasToDataUrl(canvas);
      const { ref } = await upload({
        type: "image",
        mimeType: "image/jpeg",
        url: dataUrl,
        thumbnailUrl: dataUrl,
        aiDisclosure: "none",
      });
      await addElement({
        type: "image",
        ref,
        altText: { text: "Vintage gradient background", decorative: undefined },
      });
    } finally {
      setIsLoading(false);
    }
  }, [renderOpts, exportSize, exportHiRes, addElement]);

  const previewCursor =
    mode === "linear" ? "default" : dragId ? "grabbing" : "crosshair";

  const hint =
    mode === "spots"
      ? "Click preview to add a spot. Drag to move."
      : mode === "radial" || mode === "conic"
        ? "Drag preview to move the center."
        : "Multi-stop gradients with film grain.";

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Title size="small">Vintage Gradient</Title>
        <Text size="small" tone="tertiary">
          {hint}
        </Text>

        <FormField
          label="Mode"
          control={() => (
            <SegmentedControl<Mode>
              value={mode}
              onChange={setMode}
              options={[
                { label: "Linear", value: "linear" },
                { label: "Radial", value: "radial" },
                { label: "Conic", value: "conic" },
                { label: "Spots", value: "spots" },
              ]}
            />
          )}
        />

        <FormField
          label="Presets"
          control={() => (
            <Grid columns={4} spacing="1u">
              {mode === "spots"
                ? SPOTS_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applySpots(p)}
                      title={p.name}
                      aria-label={p.name}
                      style={presetButtonStyle(presetSpotsCss(p))}
                    />
                  ))
                : GRADIENT_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyGradient(p)}
                      title={p.name}
                      aria-label={p.name}
                      style={presetButtonStyle(presetGradientCss(p.stops))}
                    />
                  ))}
            </Grid>
          )}
        />

        <Box>
          <Rows spacing="1u">
            <Box display="flex" alignItems="center">
              <Box width="full">
                <Text size="small" variant="bold">
                  My presets ({customPresets.length})
                </Text>
              </Box>
              <Button
                variant="tertiary"
                onClick={() => setSavingName("")}
                disabled={savingName !== null}
              >
                Save current
              </Button>
            </Box>
            {savingName !== null && (
              <Box display="flex" alignItems="center">
                <Box width="full" paddingEnd="1u">
                  <TextInput
                    value={savingName}
                    onChange={(v) => setSavingName(v)}
                    placeholder="Preset name"
                  />
                </Box>
                <Button variant="primary" onClick={commitSave}>
                  Save
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => setSavingName(null)}
                >
                  Cancel
                </Button>
              </Box>
            )}
            {customPresets.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {customPresets.map((p) => (
                  <div key={p.id} style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => applyCustom(p)}
                      title={p.name}
                      aria-label={p.name}
                      style={presetButtonStyle(customPresetCss(p), {
                        width: 60,
                        height: 40,
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => deleteCustom(p.id)}
                      title="Delete preset"
                      aria-label={`Delete ${p.name}`}
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        fontSize: 11,
                        lineHeight: "16px",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Rows>
        </Box>

        <FormField
          label="Preview"
          control={() => (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                background:
                  "repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 / 16px 16px",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <canvas
                ref={previewRef}
                onPointerDown={onPreviewPointerDown}
                onPointerMove={onPreviewPointerMove}
                onPointerUp={onPreviewPointerUp}
                onPointerCancel={onPreviewPointerUp}
                style={{
                  maxWidth: "100%",
                  borderRadius: 6,
                  display: "block",
                  touchAction: "none",
                  cursor: previewCursor,
                }}
              />
            </div>
          )}
        />

        <FormField
          label="Aspect ratio"
          control={() => (
            <SegmentedControl<Ratio>
              value={ratio}
              onChange={setRatio}
              options={ASPECT_RATIOS.map((r) => ({
                label: r.label,
                value: r.value,
              }))}
            />
          )}
        />

        <Switch
          label="Export at 2x (sharper)"
          value={exportHiRes}
          onChange={setExportHiRes}
        />

        {(mode === "linear" || mode === "conic") && (
          <FormField
            label={`Angle: ${angle}°`}
            control={() => (
              <Slider
                min={0}
                max={360}
                step={1}
                value={angle}
                onChange={setAngle}
              />
            )}
          />
        )}

        {(mode === "radial" || mode === "conic") && (
          <Box display="flex" alignItems="center">
            <Box paddingEnd="1u" width="full">
              <Text size="small" tone="tertiary">
                Center: {Math.round(center.x * 100)},{" "}
                {Math.round(center.y * 100)}
              </Text>
            </Box>
            <Button
              variant="tertiary"
              onClick={() => setCenter({ x: 0.5, y: 0.5 })}
            >
              Reset
            </Button>
          </Box>
        )}

        {(mode === "linear" || mode === "radial" || mode === "conic") && (
          <Box>
            <Rows spacing="1u">
              <Text size="small" variant="bold">
                Color stops ({stops.length})
              </Text>
              {sortedStops.map((stop, i) => {
                const prev = i > 0 ? sortedStops[i - 1]!.position : 0;
                const next =
                  i < sortedStops.length - 1
                    ? sortedStops[i + 1]!.position
                    : 100;
                return (
                  <Box
                    key={stop.id}
                    display="flex"
                    alignItems="center"
                    background="neutralLow"
                    borderRadius="standard"
                    padding="1u"
                  >
                    <ColorSelector
                      color={stop.color}
                      onChange={(color) => updateStop(stop.id, { color })}
                    />
                    <Box paddingStart="1u" paddingEnd="1u" width="full">
                      <Slider
                        min={prev}
                        max={next}
                        step={1}
                        value={stop.position}
                        onChange={(position) =>
                          updateStop(stop.id, { position })
                        }
                      />
                    </Box>
                    <div style={{ width: 32, textAlign: "right" }}>
                      <Text size="small" tone="tertiary">
                        {stop.position}
                      </Text>
                    </div>
                    <Button
                      variant="tertiary"
                      icon={TrashIcon}
                      ariaLabel="Remove stop"
                      onClick={() => removeStop(stop.id)}
                      disabled={stops.length <= 2}
                    />
                  </Box>
                );
              })}
              <Button
                variant="secondary"
                icon={PlusIcon}
                onClick={addStop}
                stretch
              >
                Add stop
              </Button>
            </Rows>
          </Box>
        )}

        {mode === "spots" && (
          <Box>
            <Rows spacing="1u">
              <FormField
                label="Base color"
                control={() => (
                  <ColorSelector color={baseColor} onChange={setBaseColor} />
                )}
              />
              <FormField
                label="Blend mode"
                control={() => (
                  <SegmentedControl<BlendMode>
                    value={blendMode}
                    onChange={setBlendMode}
                    options={BLEND_OPTIONS}
                  />
                )}
              />
              <Text size="small" variant="bold">
                Spots ({spots.length})
              </Text>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {spots.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSpotId(s.id)}
                    title={`Spot ${i + 1}`}
                    aria-label={`Select spot ${i + 1}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border:
                        s.id === selectedSpotId
                          ? "2px solid #111"
                          : "2px solid rgba(0,0,0,0.15)",
                      background: s.color,
                      cursor: "pointer",
                      padding: 0,
                      opacity: s.opacity,
                    }}
                  />
                ))}
              </div>
              {selectedSpot ? (
                <Box
                  background="neutralLow"
                  borderRadius="standard"
                  padding="1u"
                >
                  <Rows spacing="1u">
                    <Box display="flex" alignItems="center">
                      <ColorSelector
                        color={selectedSpot.color}
                        onChange={(color) =>
                          updateSpot(selectedSpot.id, { color })
                        }
                      />
                      <Box paddingStart="1u" width="full">
                        <Text size="small" tone="tertiary">
                          Position: {Math.round(selectedSpot.x * 100)},{" "}
                          {Math.round(selectedSpot.y * 100)}
                        </Text>
                      </Box>
                      <Button
                        variant="tertiary"
                        icon={TrashIcon}
                        ariaLabel="Remove spot"
                        onClick={() => removeSpot(selectedSpot.id)}
                      />
                    </Box>
                    <FormField
                      label={`Radius: ${Math.round(selectedSpot.radius * 100)}%`}
                      control={() => (
                        <Slider
                          min={5}
                          max={100}
                          step={1}
                          value={Math.round(selectedSpot.radius * 100)}
                          onChange={(v) =>
                            updateSpot(selectedSpot.id, { radius: v / 100 })
                          }
                        />
                      )}
                    />
                    <FormField
                      label={`Opacity: ${Math.round(selectedSpot.opacity * 100)}%`}
                      control={() => (
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(selectedSpot.opacity * 100)}
                          onChange={(v) =>
                            updateSpot(selectedSpot.id, { opacity: v / 100 })
                          }
                        />
                      )}
                    />
                  </Rows>
                </Box>
              ) : (
                <Text size="small" tone="tertiary">
                  Click a spot above or in the preview to edit.
                </Text>
              )}
            </Rows>
          </Box>
        )}

        <FormField
          label={`Vignette: ${vignette}%`}
          control={() => (
            <Slider
              min={0}
              max={100}
              step={1}
              value={vignette}
              onChange={setVignette}
            />
          )}
        />

        <FormField
          label={`Grain: ${noise}%`}
          control={() => (
            <Slider
              min={0}
              max={100}
              step={1}
              value={noise}
              onChange={setNoise}
            />
          )}
        />

        <FormField
          label={`Grain size: ${grainSize}px`}
          control={() => (
            <Slider
              min={1}
              max={4}
              step={1}
              value={grainSize}
              onChange={setGrainSize}
            />
          )}
        />

        <Switch
          label="Color grain (RGB)"
          value={colorNoise}
          onChange={setColorNoise}
        />

        <Button
          variant="secondary"
          onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
          stretch
        >
          Reroll grain
        </Button>

        <Button
          variant="primary"
          onClick={onAdd}
          loading={isLoading}
          disabled={!addElement}
          stretch
        >
          Add to design
        </Button>

        <canvas ref={exportRef} style={{ display: "none" }} />
      </Rows>
    </div>
  );
};

function presetButtonStyle(
  background: string,
  override?: { width?: number; height?: number },
): React.CSSProperties {
  return {
    height: override?.height ?? 40,
    width: override?.width,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    padding: 0,
    background,
  };
}

// Async canvas -> JPEG data URL. Uses toBlob (off-main-thread encode in most browsers)
// and FileReader to base64-encode the bytes. JPEG over PNG because Canva caps upload
// payload size and a 2x export PNG with grain easily exceeds that limit.
function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  mimeType = "image/jpeg",
  quality = 0.95,
): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode canvas"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () =>
          reject(reader.error ?? new Error("FileReader failed"));
        reader.readAsDataURL(blob);
      },
      mimeType,
      quality,
    );
  });
}

function presetGradientCss(stops: { color: string; position: number }[]) {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const parts = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  return `linear-gradient(135deg, ${parts})`;
}

function presetSpotsCss(p: SpotsPreset) {
  const layers = p.spots
    .map(
      (s) =>
        `radial-gradient(circle at ${Math.round(s.x * 100)}% ${Math.round(
          s.y * 100,
        )}%, ${s.color} 0%, ${hexToRgba(s.color, 0)} ${Math.round(
          s.radius * 60,
        )}%)`,
    )
    .reverse()
    .join(", ");
  return `${layers}, ${p.base}`;
}

function customPresetCss(p: CustomPreset) {
  if (p.mode === "spots" && p.spots && p.baseColor) {
    return presetSpotsCss({ name: "", base: p.baseColor, spots: p.spots });
  }
  if (p.stops) {
    return presetGradientCss(p.stops);
  }
  return "#888";
}
