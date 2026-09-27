import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useDialog — keyboard/screen-reader behaviour every modal needs (WCAG 2.1.2,
 * 2.4.3; IS 5568): on open, focus moves into the dialog; Tab / Shift+Tab stay
 * inside it; Escape closes it; on close, focus returns to whatever opened it.
 * Returns a ref for the dialog panel element.
 *
 *   const ref = useDialog(open, onClose);
 *   <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="…">
 */
export function useDialog(open, onClose, { initialFocus } = {}) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const panel = ref.current;
    const focusables = () => (panel ? [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement) : []);

    // Defer so the panel's content has rendered.
    const t = setTimeout(() => {
      if (!panel || panel.contains(document.activeElement)) return;
      const target = (initialFocus && panel.querySelector(initialFocus)) || focusables()[0] || panel;
      if (target === panel && !panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, 30);

    const onKey = (e) => {
      // Only the top-most open dialog reacts (e.g. the privacy policy opened
      // from inside the sign-up popup) — portaled dialogs come later in the DOM.
      const top = [...document.querySelectorAll('[aria-modal="true"]')].pop();
      if (top && panel && top !== panel && !panel.contains(top)) return;
      if (e.key === "Escape") { e.stopPropagation(); onCloseRef.current?.(); return; }
      if (e.key !== "Tab" || !panel) return;
      const els = focusables();
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open, initialFocus]);

  return ref;
}
