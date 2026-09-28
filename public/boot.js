// Runs from <head>, before the app bundle and before first paint (a plain
// external file — the CSP disallows inline scripts). Stops Safari/Chrome from
// restoring an old scroll offset on reload / tab restore, which otherwise
// happens before main.jsx can switch it off — the page would open part-way
// down, starting at the hero photo instead of the header.
try {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  window.addEventListener("pageshow", function (e) { if (e.persisted) window.scrollTo(0, 0); });
} catch (e) { /* never block page load */ }
