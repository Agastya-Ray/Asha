/**
 * Where the fairy's fingertip should go to point at something: the words on it, not its box. A heading's box
 * runs the whole width of its card, so aiming at the box left her pointing at empty space past a short word.
 */
export function aimRect(el: Element): DOMRect {
  const box = el.getBoundingClientRect();
  try {
    // the first line of its words: for a heading or a button, exactly the words. Only text counts here:
    // a range over the whole element also returns the boxes of the elements inside, which run full width.
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const range = document.createRange();
    let first: DOMRect | undefined;
    let left = Infinity;
    let right = -Infinity;
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      range.selectNodeContents(n);
      const rects = Array.from(range.getClientRects()).filter((r) => r.width > 2 && r.height > 4);
      if (!rects.length) continue;
      first ??= rects[0];
      // the rest of the first line, which can be several pieces (a name in bold, then the rest)
      const line = rects.filter((r) => Math.abs(r.top - first!.top) < first!.height / 2);
      if (!line.length) break;
      left = Math.min(left, ...line.map((r) => r.left));
      right = Math.max(right, ...line.map((r) => r.right));
    }
    if (first && right - left < box.width) return new DOMRect(left, first.top, right - left, first.height);
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
