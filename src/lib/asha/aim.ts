/**
 * Where the fairy's fingertip should go to point at something: the words on it, not its box. A heading's box
 * runs the whole width of its card, so aiming at the box left her pointing at empty space past a short word.
 */
export function aimRect(el: Element): DOMRect {
  const box = el.getBoundingClientRect();
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    // the first line of its text: for a heading or a button, exactly the words
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 4 && r.height > 4);
    const first = rects[0];
    if (first) {
      // the whole first line, which can be several pieces (a name in bold, then the rest)
      const line = rects.filter((r) => Math.abs(r.top - first.top) < first.height / 2);
      const left = Math.min(...line.map((r) => r.left));
      const right = Math.max(...line.map((r) => r.right));
      if (right - left < box.width) return new DOMRect(left, first.top, right - left, first.height);
    }
  } catch {
    /* no text to measure: the box will do */
  }
  return box;
}

/**
 * Her place when pointing: fingertip just after the words, at their middle (her picture's fingertip is on its
 * left edge, `tipY` of the way down). With no room on the right she comes from the left, turned round.
 */
export function aimAt(t: DOMRect, w: number, h: number, tipY: number, vw: number) {
  const gap = 4;
  const flip = t.right + gap + w > vw - 4 && t.left - gap - w >= 4;
  const tipX = flip ? t.left - gap : t.right + gap;
  const x = Math.max(4, Math.min(vw - w - 4, flip ? tipX - w : tipX));
  const y = t.top + t.height / 2 - h * tipY;
  return { x, y, flip, tipX: flip ? x + w : x, tipYAt: y + h * tipY };
}
