import React, { useState } from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";

/**
 * AdminImageField — admin-only image control.
 * Lets the admin paste an image URL OR upload a file (stored in Supabase
 * Storage in cloud mode, embedded as a data-URL in local mode).
 *
 * This is the ONLY place in the app that can change an image — storefront
 * visitors never see an upload control.
 */
export function AdminImageField({ value, onChange, placeholder = "https://... או העלאה ←" }) {
  const { uploadImage } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (ex) {
      setErr(ex.message || "העלאה נכשלה");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <div style={css("display:flex;gap:10px;")}>
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={css("flex:1;padding:12px 14px;border:1px solid var(--c-line-strong);border-radius:11px;font-size:15px;background:#fff;")}
        />
        <label style={css("padding:12px 16px;background:var(--c-line-soft);border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;")}>
          {busy ? "מעלה…" : "העלאה"}
          <input type="file" accept="image/*" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
        </label>
      </div>
      {err && <div style={css("color:var(--c-danger);font-size:12.5px;margin-top:6px;")}>{err}</div>}
    </div>
  );
}
