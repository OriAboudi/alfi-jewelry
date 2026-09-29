import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { setTitle } from "../lib/pricing.js";
import { pathFor } from "../lib/routes.js";
import { useStore } from "../context/StoreContext.jsx";

/**
 * SetStack — a set's photos as a neat deck of cards (up to 4 pieces): the
 * first piece in front, the others stepped up behind it.
 */
export function SetStack({ set, count = true }) {
  const stack = set.members.slice(0, 4);
  return (
    <div className="rd-set-stack" aria-hidden="true">
      {stack.map((m, i) => (
        <span key={m.id} className="rd-set-photo" style={{ "--d": i, zIndex: stack.length - i }}>
          {m.image ? <img src={m.image} alt="" loading="lazy" decoding="async" /> : null}
        </span>
      ))}
      {count && <span className="rd-set-count">{set.members.length} פריטים</span>}
    </div>
  );
}

/**
 * SetCard — a product set in the home "סטים" slider and on /סטים. The whole
 * card links to the set's own page (/סט/<name>).
 */
export function SetCard({ set }) {
  const { openSet } = useStore();
  const save = set.regular - set.price;
  return (
    <a
      href={pathFor("set", { pid: set.name })}
      onClick={(e) => { e.preventDefault(); openSet(set.name); }}
      aria-label={`${setTitle(set.name)}, ${set.members.length} פריטים, ${fmt(set.price)}`}
      className="rd-card glass-strong rd-set-card"
    >
      <SetStack set={set} />
      <span style={css("padding:0 8px;display:flex;flex-direction:column;gap:6px;margin-top:14px;text-align:right;")}>
        <span className="serif rd-card-name" style={css("line-height:1.25;")}>{setTitle(set.name)}</span>
        <span className="rd-card-meta" style={css("color:var(--text-muted);line-height:1.5;")}>{set.members.map((m) => m.name).join(" · ")}</span>
        <span style={css("display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;")}>
          <span style={css("font-weight:700;color:var(--c-accent);font-size:17px;")}>{fmt(set.price)}</span>
          {save > 0 && <s style={css("color:var(--c-ink-mute);font-size:14px;")}>{fmt(set.regular)}</s>}
          {save > 0 && <span style={css("font-size:12px;font-weight:600;color:var(--c-success);")}>חיסכון {fmt(save)}</span>}
        </span>
      </span>
      <span className="rd-add-btn rd-outline rd-set-open-cta">לצפייה בסט</span>
    </a>
  );
}
