import React from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";

export function Footer() {
  const { go } = useStore();
  return (
    <footer style={css("background:#3a2c25;color:#e8dccf;margin-top:60px;")}>
      <div className="r-footer-grid" style={css("max-width:1240px;margin:0 auto;padding:54px 32px 40px;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:36px;")}>
        <div>
          <div style={css("font-family:'Frank Ruhl Libre',serif;font-size:24px;letter-spacing:.14em;margin-bottom:10px;")}>ALFI</div>
          <p style={css("font-size:14px;color:#b9a797;max-width:240px;")}>תכשיטי כסף סטרלינג 925 בעבודת יד, בהשראת הטבע.</p>
        </div>
        <div>
          <div style={css("font-weight:600;font-size:14px;margin-bottom:14px;")}>חנות</div>
          <div className="r-footer-links" style={css("display:flex;flex-direction:column;gap:9px;font-size:13.5px;color:#b9a797;")}>
            <span onClick={() => go("catalog")} style={css("cursor:pointer;")}>טבעות</span>
            <span onClick={() => go("catalog")} style={css("cursor:pointer;")}>שרשראות</span>
            <span onClick={() => go("catalog")} style={css("cursor:pointer;")}>עגילים</span>
            <span onClick={() => go("catalog")} style={css("cursor:pointer;")}>צמידים</span>
          </div>
        </div>
        <div>
          <div style={css("font-weight:600;font-size:14px;margin-bottom:14px;")}>גלריה</div>
          <div className="r-footer-links" style={css("display:flex;flex-direction:column;gap:9px;font-size:13.5px;color:#b9a797;")}>
            <span onClick={() => go("collections")} style={css("cursor:pointer;")}>קולקציות</span>
            <span onClick={() => go("story")} style={css("cursor:pointer;")}>הסיפור שלנו</span>
            <span style={css("cursor:pointer;")}>טיפוח התכשיט</span>
            <span style={css("cursor:pointer;")}>צור קשר</span>
          </div>
        </div>
        <div>
          <div style={css("font-weight:600;font-size:14px;margin-bottom:14px;")}>הצטרפו לרשימה</div>
          <p style={css("font-size:13.5px;color:#b9a797;margin-bottom:12px;")}>10% הנחה על ההזמנה הראשונה</p>
          <div style={css("display:flex;gap:8px;")}>
            <input placeholder="אימייל" style={css("flex:1;padding:10px 12px;border:1px solid #5a4a40;border-radius:10px;background:#4a3a31;color:#fff;font-size:13.5px;")} />
            <button style={css("padding:10px 16px;background:#bd7355;color:#fff;border:none;border-radius:10px;font-size:13.5px;font-weight:600;cursor:pointer;")}>שליחה</button>
          </div>
        </div>
      </div>
      <div style={css("border-top:1px solid #4a3a31;padding:18px 32px;text-align:center;font-size:12.5px;color:#9a8676;")}>© 2026 ALFI · כל הזכויות שמורות</div>
    </footer>
  );
}
