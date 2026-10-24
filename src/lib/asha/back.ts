import { useEffect, useRef } from "react";

// Android back key: open sheets and sub-screens register what "back" means for them; the newest one wins.
const stack: { current: () => boolean }[] = [];

/** While `on`, the back key runs `handler` first. Return true when it handled the key. */
export function useBack(handler: () => boolean, on = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!on) return;
    stack.push(ref);
    return () => {
      const i = stack.lastIndexOf(ref);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [on]);
}

/** Runs the newest back handler that takes the key; false means nothing did. */
export function runBack() {
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i].current()) return true;
  return false;
}
