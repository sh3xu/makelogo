import type { Contour, Point } from "./contour";
import { fitCubicBeziers } from "./curveFit";
import { rdpSimplify } from "./simplify";
import { chaikinSubdivide } from "./subdivision";

export interface BezierSegment {
  p0: Point;
  c1: Point;
  c2: Point;
  p3: Point;
}

export interface SmoothedPath {
  segments: BezierSegment[];
  isHole: boolean;
}

/**
 * Remove collinear points from a contour, keeping only corner vertices.
 */
function simplifyContour(points: Point[]): Point[] {
  if (points.length < 3) return [...points];

  const simplified: Point[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]!;
    const curr = points[i]!;
    const next = points[(i + 1) % n]!;

    const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
    if (Math.abs(cross) > 1e-10) {
      simplified.push(curr);
    }
  }

  return simplified.length >= 3 ? simplified : [...points];
}

/**
 * Create a straight-line bezier segment (degenerate cubic with control
 * points on the line).
 */
function lineBezier(p0: Point, p3: Point): BezierSegment {
  const dx = (p3.x - p0.x) / 3;
  const dy = (p3.y - p0.y) / 3;
  return {
    p0,
    c1: { x: p0.x + dx, y: p0.y + dy },
    c2: { x: p3.x - dx, y: p3.y - dy },
    p3,
  };
}

// Apple squircle bezier handle ratio — approximates a superellipse with n≈5.
// Standard circular arc uses κ≈0.5523; higher values keep edges straight
// longer before curving, producing the characteristic squircle shape.
const SQUIRCLE_KAPPA = 0.82;

/**
 * Convert a polygon contour to smooth cubic Bezier curves using squircle-like
 * corner rounding (continuous curvature, matching Apple's iOS icon shape).
 *
 * The algorithm:
 * 1. Collapse collinear marching-squares midpoints to corner vertices
 * 2. At each corner, inset along both edges by `radius` (controlled by alpha)
 * 3. Place bezier handles using a superellipse-derived kappa, creating curves
 *    that hug straight edges before smoothly rounding the corner
 *
 * alpha=0: sharp polygon corners (no rounding)
 * alpha=1: maximum squircle-style smoothing
 */
export function smoothContour(contour: Contour, alpha: number): SmoothedPath {
  const raw = contour.points;
  if (raw.length < 3) {
    return { segments: [], isHole: contour.isHole };
  }

  const a = Math.max(0, Math.min(1, alpha));
  const pts = simplifyContour(raw);
  const n = pts.length;

  if (n < 3) {
    return { segments: [], isHole: contour.isHole };
  }

  // alpha=0: return the simplified polygon as straight segments
  if (a < 1e-6) {
    const segments: BezierSegment[] = [];
    for (let i = 0; i < n; i++) {
      segments.push(lineBezier(pts[i]!, pts[(i + 1) % n]!));
    }
    return { segments, isHole: contour.isHole };
  }

  // Pre-compute edge lengths
  const edgeLengths: number[] = [];
  for (let i = 0; i < n; i++) {
    const curr = pts[i]!;
    const next = pts[(i + 1) % n]!;
    edgeLengths.push(Math.hypot(next.x - curr.x, next.y - curr.y));
  }

  // For each corner vertex, compute the squircle arc endpoints and handles
  interface CornerArc {
    start: Point; // where the arc begins (on the incoming edge)
    end: Point; // where the arc ends (on the outgoing edge)
    c1: Point; // handle near start
    c2: Point; // handle near end
  }

  const corners: CornerArc[] = [];

  for (let i = 0; i < n; i++) {
    const curr = pts[i]!;
    const prev = pts[(i - 1 + n) % n]!;
    const next = pts[(i + 1) % n]!;

    const inLen = edgeLengths[(i - 1 + n) % n]!;
    const outLen = edgeLengths[i]!;

    const dirIn = {
      x: (prev.x - curr.x) / inLen,
      y: (prev.y - curr.y) / inLen,
    };
    const dirOut = {
      x: (next.x - curr.x) / outLen,
      y: (next.y - curr.y) / outLen,
    };

    // Rounding radius: up to half the shorter adjacent edge
    const maxRadius = Math.min(inLen, outLen) * 0.5;
    const radius = maxRadius * a;

    const start: Point = {
      x: curr.x + dirIn.x * radius,
      y: curr.y + dirIn.y * radius,
    };
    const end: Point = {
      x: curr.x + dirOut.x * radius,
      y: curr.y + dirOut.y * radius,
    };

    const handleLen = radius * SQUIRCLE_KAPPA;
    const c1: Point = {
      x: start.x - dirIn.x * handleLen,
      y: start.y - dirIn.y * handleLen,
    };
    const c2: Point = {
      x: end.x - dirOut.x * handleLen,
      y: end.y - dirOut.y * handleLen,
    };

    corners.push({ start, end, c1, c2 });
  }

  // Build path: corner curve, then straight line to next corner
  const segments: BezierSegment[] = [];

  for (let i = 0; i < n; i++) {
    const corner = corners[i]!;
    const nextCorner = corners[(i + 1) % n]!;

    // Squircle corner arc
    segments.push({
      p0: corner.start,
      c1: corner.c1,
      c2: corner.c2,
      p3: corner.end,
    });

    // Straight edge to next corner (skip if zero-length)
    const dist = Math.hypot(nextCorner.start.x - corner.end.x, nextCorner.start.y - corner.end.y);
    if (dist > 1e-6) {
      segments.push(lineBezier(corner.end, nextCorner.start));
    }
  }

  return { segments, isHole: contour.isHole };
}

/**
 * Convert a polygon contour to smooth cubic Bezier curves using Chaikin
 * subdivision, RDP simplification, and Catmull-Rom curve fitting.
 *
 * This pipeline produces genuinely smooth curves from staircase polygons,
 * unlike squircle corner rounding which only rounds corners.
 *
 * alpha controls overall smoothness:
 *   - More subdivision passes at higher alpha
 *   - Less RDP simplification at higher alpha (preserve detail)
 *   - Higher Catmull-Rom tension at higher alpha (smoother curves)
 */
export function smoothContourSubdivision(contour: Contour, alpha: number): SmoothedPath {
  const raw = contour.points;
  if (raw.length < 3) {
    return { segments: [], isHole: contour.isHole };
  }

  const a = Math.max(0, Math.min(1, alpha));

  // Step 1: Remove collinear points
  const simplified = simplifyContour(raw);
  if (simplified.length < 3) {
    return { segments: [], isHole: contour.isHole };
  }

  // Step 2: Chaikin subdivision — more passes at higher alpha
  let passes: number;
  if (a < 0.2) passes = 1;
  else if (a < 0.4) passes = 2;
  else if (a < 0.6) passes = 3;
  else if (a < 0.8) passes = 4;
  else passes = 5;

  const subdivided = chaikinSubdivide(simplified, passes);

  // Step 3: RDP simplification — less aggressive at higher alpha
  const epsilon = 0.02 + (1 - a) * 0.08;
  const rdpResult = rdpSimplify(subdivided, epsilon);

  // Step 4: Catmull-Rom curve fitting — higher tension at higher alpha
  const tension = 0.4 + a * 0.2;
  const segments = fitCubicBeziers(rdpResult, tension);

  return { segments, isHole: contour.isHole };
}

/**
 * Detect if a contour is roughly circular/convex (no dominant stroke axis).
 * Uses the ratio of eigenvalues from PCA — if they're close, it's a blob/circle.
 */
function isRoundShape(points: Point[]): boolean {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  let xx = 0, xy = 0, yy = 0;
  for (const p of points) {
    const dx = p.x - cx, dy = p.y - cy;
    xx += dx * dx; xy += dx * dy; yy += dy * dy;
  }
  // Eigenvalues of 2x2 covariance matrix
  const trace = xx + yy;
  const det = xx * yy - xy * xy;
  const disc = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
  const l1 = trace / 2 + disc;
  const l2 = trace / 2 - disc;
  // If ratio is close to 1, shape has no dominant axis = round/blob
  const ratio = l2 / (l1 + 1e-9);
  return ratio > 0.45; // tweak: >0.45 = too round for bristle treatment
}

export function smoothContourHandbrush(contour: Contour, alpha: number): SmoothedPath {
  const raw = contour.points;
  if (raw.length < 3) return { segments: [], isHole: contour.isHole };

  // REVERSED: high alpha = more stylized/chaotic, low alpha = subtle
  const a = Math.max(0, Math.min(1, 1 - alpha));

  const simplified = simplifyContour(raw);
  if (simplified.length < 3) return { segments: [], isHole: contour.isHole };

  // === Round/circular shapes: skip bristle deformation, just smooth flow ===
  if (isRoundShape(simplified)) {
    const passes = 2;
    const subdivided = chaikinSubdivide(simplified, passes);
    const rdpResult = rdpSimplify(subdivided, 0.03);
    const tension = 0.45;
    const segments = fitCubicBeziers(rdpResult, tension);
    // Gentle ink drag only — no spikes
    return {
      isHole: contour.isHole,
      segments: segments.map((seg) => ({
        ...seg,
        c2: {
          x: seg.c2.x + (seg.p3.x - seg.c2.x) * 0.15,
          y: seg.c2.y + (seg.p3.y - seg.c2.y) * 0.15,
        },
      })),
    };
  }

  // === Stroke-shaped contours: full bristle treatment ===

  // PCA: find stroke axis
  const cx = simplified.reduce((s, p) => s + p.x, 0) / simplified.length;
  const cy = simplified.reduce((s, p) => s + p.y, 0) / simplified.length;
  let xx = 0, xy = 0, yy = 0;
  for (const p of simplified) {
    const dx = p.x - cx, dy = p.y - cy;
    xx += dx * dx; xy += dx * dy; yy += dy * dy;
  }
  const angle = Math.atan2(2 * xy, xx - yy) / 2;
  const axisX = Math.cos(angle);
  const axisY = Math.sin(angle);
  const perpX = -axisY;
  const perpY = axisX;

  const projections = simplified.map(p => ({
    along: (p.x - cx) * axisX + (p.y - cy) * axisY,
    across: (p.x - cx) * perpX + (p.y - cy) * perpY,
    p,
  }));
  const minAlong = Math.min(...projections.map(p => p.along));
  const maxAlong = Math.max(...projections.map(p => p.along));
  const strokeLen = maxAlong - minAlong;

  // Alpha reversed: a=1 (user alpha=0) is subtle, a=0 (user alpha=1) is wild
  // More bristles and bigger spikes at high user alpha
  const bristleCount = Math.floor(12 + (1 - a) * 20);   // 12–32 bristles
  const spikeAmplitude = 0.15 + (1 - a) * 0.65;         // 0.15–0.8 units
  const taperPower = 1.8 + a * 2.0;                      // sharper taper at low alpha

  const deformed = simplified.map((p, i) => {
    const proj = projections[i]!;
    const t = strokeLen > 1e-6 ? (proj.along - minAlong) / strokeLen : 0.5;
    const taper = Math.pow(4 * t * (1 - t), taperPower * 0.4);
    const side = proj.across >= 0 ? 1 : -1;

    const bristlePhase = (proj.along / (strokeLen + 1e-6)) * bristleCount * Math.PI * 2;
    const spike =
      Math.abs(Math.sin(bristlePhase * 1.0 + i * 0.7)) * 0.5 +
      Math.abs(Math.sin(bristlePhase * 2.3 + i * 1.3)) * 0.3 +
      Math.abs(Math.sin(bristlePhase * 0.4 + i * 2.1)) * 0.2;

    const pushOut = spike * spikeAmplitude * taper * side;

    return {
      x: p.x + perpX * pushOut,
      y: p.y + perpY * pushOut,
    };
  });

  // Taper ends to sharp points
  const tapered = deformed.map((p, i) => {
    const proj = projections[i]!;
    const t = strokeLen > 1e-6 ? (proj.along - minAlong) / strokeLen : 0.5;
    const endness = Math.min(t, 1 - t) * 2;
    const taperAmount = Math.max(0, 1 - Math.pow(endness, 1 / taperPower));
    const acrossCurrent = (p.x - cx) * perpX + (p.y - cy) * perpY;
    return {
      x: p.x - perpX * acrossCurrent * taperAmount,
      y: p.y - perpY * acrossCurrent * taperAmount,
    };
  });

  // Subdivision: FEWER passes at high alpha (preserve spiky chaos)
  const passes = 1 + Math.floor(a * 2); // reversed: more passes when subtle
  const subdivided = chaikinSubdivide(tapered, passes);

  // RDP: tighter at high alpha (keep more spikes)
  const epsilon = 0.006 + a * 0.018; // reversed: looser when subtle
  const rdpResult = rdpSimplify(subdivided, epsilon);

  // Tension: low always — spiky not bubbly
  const tension = 0.15 + a * 0.12;
  const baseSegments = fitCubicBeziers(rdpResult, tension);

  // Ink drag on exit handles — stronger toward stroke end
  return {
    isHole: contour.isHole,
    segments: baseSegments.map((seg, i) => {
      const t = i / Math.max(baseSegments.length - 1, 1);
      const dragAmount = 0.08 + t * (0.3 + (1 - a) * 0.25); // more drag at high alpha
      return {
        ...seg,
        c2: {
          x: seg.c2.x + (seg.p3.x - seg.c2.x) * dragAmount,
          y: seg.c2.y + (seg.p3.y - seg.c2.y) * dragAmount,
        },
      };
    }),
  };
}

/**
 * Convert a SmoothedPath to an SVG path data string.
 */
export function pathToSvgD(path: SmoothedPath): string {
  if (path.segments.length === 0) return "";

  const first = path.segments[0]!;
  let d = `M ${first.p0.x} ${first.p0.y}`;

  for (const seg of path.segments) {
    d += ` C ${seg.c1.x} ${seg.c1.y}, ${seg.c2.x} ${seg.c2.y}, ${seg.p3.x} ${seg.p3.y}`;
  }

  d += " Z";
  return d;
}
