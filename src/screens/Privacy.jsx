import React from "react";
import { LegalPageShell } from "../components/LegalPageShell.jsx";

const SECTIONS = [
  "איזה מידע נאסף",
  "כיצד המידע נשמר ומשמש",
  "עוגיות (Cookies)",
  "שיתוף מידע עם צדדים שלישיים",
  "זכויות המשתמש/ת במידע",
  "יצירת קשר בנושאי פרטיות",
];

export function Privacy() {
  return <LegalPageShell title="מדיניות פרטיות" sections={SECTIONS} />;
}
