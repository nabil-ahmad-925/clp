/**
 * Turning a drawn mockup (an SVG) into a picture. On its own so the admin shares it (its scripts/sync-widgets.mjs copies
 * this file): My store saves a partner's item mockups with it.
 */
/**
 * The mockup as a PNG (the "Download mockup" button): the SVG with its images inlined (so the browser can draw it),
 * on the design's soft background, at 1200 px.
 */
export async function mockupPng(svg: SVGSVGElement, size = 1200): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(size));
  clone.setAttribute('height', String(size));
  for (const img of Array.from(clone.querySelectorAll('image'))) {
    const href = img.getAttribute('href') ?? '';
    if (!href || href.startsWith('data:')) continue;
    try {
      // Never the browser's cached copy: one loaded by an <img> (no Origin) has no CORS header from S3, so reading
      // it again fails. A fresh request carries the Origin and gets the header.
      const blob = await (await fetch(href, { mode: 'cors', cache: 'no-store' })).blob();
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      img.setAttribute('href', data);
    } catch {
      img.remove();
    }
  }
  const markup = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size * 0.4, 0, size / 2, size * 0.4, size * 0.7);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(1, '#F4F3F0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no image'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}
