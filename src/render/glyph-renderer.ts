import type { GlyphStyle } from '../data/style';

type Surface = HTMLCanvasElement | OffscreenCanvas;

/**
 * Monospace character-grid renderer on a 2D canvas.
 * - Backing store scaled by devicePixelRatio; cell size is a whole number of device px
 *   so glyphs stay crisp.
 * - Each (char, colours, weight) is rasterised once into an offscreen canvas and blitted.
 */
export class GlyphRenderer {
  readonly ctx: CanvasRenderingContext2D;
  /** Cell size in device pixels. */
  cellW = 10;
  cellH = 20;
  /** Viewport in device pixels. */
  width = 0;
  height = 0;
  dpr = 1;
  fontPx = 18;
  private cache = new Map<string, Surface>();

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly background: string,
    private readonly fontFamily: string,
    private readonly lineHeight: number,
  ) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;
  }

  /** Visible columns / rows (fractional). */
  get cols(): number {
    return this.width / this.cellW;
  }

  get rows(): number {
    return this.height / this.cellH;
  }

  get cachedGlyphs(): number {
    return this.cache.size;
  }

  /** Call on start, on resize/orientation change and after the web font loads. */
  resize(cssW: number, cssH: number, dpr: number, fontPx: number): void {
    this.dpr = Math.max(1, Math.min(dpr || 1, 3));
    this.fontPx = fontPx;
    this.width = Math.max(1, Math.round(cssW * this.dpr));
    this.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    const px = fontPx * this.dpr;
    this.ctx.font = this.font(px, false);
    this.cellW = Math.max(1, Math.round(this.ctx.measureText('M').width));
    this.cellH = Math.max(1, Math.round(px * this.lineHeight));
    this.ctx.imageSmoothingEnabled = false;
    this.cache.clear();
  }

  clear(): void {
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Draw a glyph with its top-left corner at device-pixel coordinates (rounded). */
  draw(g: GlyphStyle, px: number, py: number): void {
    const x = Math.round(px);
    const y = Math.round(py);
    if (x <= -this.cellW || y <= -this.cellH || x >= this.width || y >= this.height) return;
    this.ctx.drawImage(this.glyph(g), x, y);
  }

  private font(px: number, bold: boolean): string {
    return `${bold ? 'bold ' : ''}${px}px ${this.fontFamily}`;
  }

  private glyph(g: GlyphStyle): Surface {
    const key = `${g.ch}|${g.fg}|${g.bg ?? ''}|${g.bold ? 1 : 0}`;
    let s = this.cache.get(key);
    if (s) return s;
    s =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(this.cellW, this.cellH)
        : Object.assign(document.createElement('canvas'), {
            width: this.cellW,
            height: this.cellH,
          });
    const c = s.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    if (g.bg) {
      c.fillStyle = g.bg;
      c.fillRect(0, 0, this.cellW, this.cellH);
    }
    c.font = this.font(this.fontPx * this.dpr, !!g.bold);
    c.fillStyle = g.fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(g.ch, this.cellW / 2, this.cellH / 2 + Math.round(this.cellH * 0.04));
    this.cache.set(key, s);
    return s;
  }
}
