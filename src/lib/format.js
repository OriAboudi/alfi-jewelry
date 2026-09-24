// Money + date formatting helpers (Hebrew locale).

export const fmt = (n) => "₪" + Number(n || 0).toLocaleString("he-IL");

export const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

export const fmtDateTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("he-IL", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// Checkout field validation + Israeli phone formatting.
export const isValidEmail = (s) => /^\S+@\S+\.\S+$/.test((s || "").trim());

// Normalizes an Israeli number to 0XX-XXXXXXX / 0X-XXXXXXX as the user
// types, accepting a leading +972 as well. Not a strict carrier-prefix
// check — just shape validation (9-10 digits starting with 0, or +972).
export const formatIsraeliPhone = (raw) => {
  let digits = (raw || "").replace(/[^\d]/g, "");
  if (digits.startsWith("972")) digits = "0" + digits.slice(3);
  digits = digits.slice(0, 10);
  if (digits.length <= 3) return digits;
  const split = digits.startsWith("05") ? 3 : 2;
  return digits.slice(0, split) + "-" + digits.slice(split);
};

export const isValidIsraeliPhone = (s) => {
  const digits = (s || "").replace(/[^\d]/g, "");
  return /^0\d{8,9}$/.test(digits);
};

// "פרטי המוצר" text on the product page: the product's own details if the
// admin wrote any, otherwise the generic material + variance line.
export function productDetailsText(p) {
  return (p.details || "").trim() || `${p.material || "כסף 925"}. כל תכשיט עשוי להיות שונה במעט מהתמונה בשל תהליך הייצור.`;
}
