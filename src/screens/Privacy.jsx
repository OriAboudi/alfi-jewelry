import React from "react";
import { css } from "../lib/css.js";
import { useSeoTags } from "../hooks/useSeoTags.js";
import { PrivacyPolicyContent, PRIVACY_UPDATED } from "../components/PrivacyPolicyContent.jsx";

export function Privacy() {
  useSeoTags({
    title: "מדיניות פרטיות · ALFI",
    description: "מדיניות הפרטיות של Alfi Jewelry: איזה מידע נאסף, למה הוא משמש, איך הוא נשמר ומהן זכויותיך ביחס למידע.",
    canonical: "/מדיניות-פרטיות",
  });

  return (
    <div className="r-container glass-card" style={css("max-width:720px;margin:30px auto;padding:56px var(--sp-5) 48px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:8px;text-align:center;")}>מדיניות פרטיות</h1>
      <p style={css("text-align:center;font-size:13px;letter-spacing:.04em;color:var(--c-ink-mute);margin:0 0 34px;")}>עודכן לאחרונה: {PRIVACY_UPDATED}</p>
      <PrivacyPolicyContent />
    </div>
  );
}
