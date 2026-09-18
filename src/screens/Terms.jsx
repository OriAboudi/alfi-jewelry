import React from "react";
import { LegalPageShell } from "../components/LegalPageShell.jsx";

const SECTIONS = [
  "תנאי שימוש כלליים באתר",
  "הזמנות ותשלומים",
  "קניין רוחני",
  "אחריות והגבלת חבות",
  "יישוב מחלוקות ודין חל",
];

export function Terms() {
  return <LegalPageShell title="תנאי שימוש" sections={SECTIONS} />;
}
