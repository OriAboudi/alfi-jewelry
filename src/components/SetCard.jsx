import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";

/**
 * SetStack — a set's photos stacked like a fanned set (up to 3 pieces).
 * Hovering/focusing the card fans them a little wider.
 */
export function SetStack({ set, count = true }) {
  const stack = set.members.slice(0, 3);
  const pose = ["rd-set-pose-a", "rd-set-pose-b", "rd-set-pose-c"].slice(-stack.length);
  return (
    <div className="rd-set-stack" aria-hidden="true">
      {stack.map((m, i) => (
        <span key={m.id} className={`rd-set-photo ${pose[i]}`}>
          {m.image ? <img src={m.image} alt="" loading="lazy" decoding="async" /> : null}
        </span>
      ))}
      {count && <span className="rd-set-count">{set.members.length} פריטים</span>}
    </div>
  );
}

/**
 * SetCard — a product set in the home "סטים" slider. The whole card is one
 * button: it opens the set in place (SetDetail, under the slider), where the
 * customer sees every piece on its own, picks sizes and adds the set.
 */
export function SetCard({ set, open, onOpen }) {
  const save = set.regular - set.price;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={open}
      aria-label={`סט ${set.name}, ${set.members.length} פריטים, ${fmt(set.price)} — פתיחת הסט`}
      className={`rd-card glass-strong rd-set-card${open ? " is-open" : ""}`}
    >
      <SetStack set={set} />
      <span style={css("padding:0 8px;display:flex;flex-direction:column;gap:6px;margin-top:14px;text-align:right;")}>
        <span className="serif rd-card-name" style={css("line-height:1.25;")}>סט {set.name}</span>
        <span className="rd-card-meta" style={css("color:var(--text-muted);line-height:1.5;")}>{set.members.map((m) => m.name).join(" · ")}</span>
        <span style={css("display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;")}>
          <span style={css("font-weight:700;color:var(--c-accent);font-size:17px;")}>{fmt(set.price)}</span>
          {save > 0 && <s style={css("color:var(--c-ink-mute);font-size:14px;")}>{fmt(set.regular)}</s>}
          {save > 0 && <span style={css("font-size:12px;font-weight:600;color:var(--c-success);")}>חיסכון {fmt(save)}</span>}
        </span>
      </span>
      <span className="rd-add-btn rd-outline rd-set-open-cta">{open ? "הסט פתוח למטה ↓" : "לצפייה בסט"}</span>
    </button>
  );
}
