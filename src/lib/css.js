/**
 * css(str) — converts a plain CSS declaration string into a React style object.
 * Lets us keep the original inline-style strings verbatim instead of hand-
 * converting every rule to camelCase. Results are memoized.
 *
 *   <div style={css('padding:16px;background:#bd7355;color:#fff')} />
 *
 * For dynamic styles, just use a template literal:
 *   css(`background:${bg};color:${fg}`)
 *
 * The parser is parenthesis-aware, so values like
 *   background:url("data:image/png;base64,....") center/cover
 * survive intact (the ';' and ':' inside url(...) are not treated as
 * declaration separators).
 */
const cache = new Map();

// split on a delimiter char, but only at paren depth 0
function splitTop(str, delim, limit = Infinity) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    else if (c === delim && depth === 0) {
      out.push(str.slice(start, i));
      start = i + 1;
      if (out.length >= limit - 1) break;
    }
  }
  out.push(str.slice(start));
  return out;
}

export function css(str) {
  if (!str) return {};
  if (cache.has(str)) return cache.get(str);
  const obj = {};
  splitTop(str, ";").forEach((decl) => {
    if (!decl.trim()) return;
    const [rawKey, ...rest] = splitTop(decl, ":", 2);
    if (!rest.length) return;
    let key = rawKey.trim();
    const val = rest.join(":").trim();
    if (!key || !val) return;
    if (!key.startsWith("--")) {
      key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    }
    obj[key] = val;
  });
  cache.set(str, obj);
  return obj;
}
