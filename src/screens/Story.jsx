import React from "react";
import { css } from "../lib/css.js";
import { FlowerMark } from "../components/Ornaments.jsx";
import { useStore } from "../context/StoreContext.jsx";

export function Story() {
  const { content: C, go } = useStore();
  const values = [
    { title: C.value1Title, text: C.value1Text },
    { title: C.value2Title, text: C.value2Text },
    { title: C.value3Title, text: C.value3Text },
  ];
  const heroImg = C.storyHeroImage || C.storyImage || "floral-bg.jpg";

  return (
    <div>
      <section className="r-hero" style={css("position:relative;width:100%;height:460px;")}>
        <div style={css(`position:absolute;inset:0;background:url("${heroImg}") center/cover;`)} />
        <div style={css("position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(rgba(250,245,239,.34),rgba(250,245,239,.6));padding:24px;")}>
          <div style={css("font-size:13px;letter-spacing:.24em;color:#a85a44;margin-bottom:14px;")}>{C.storyKicker}</div>
          <h1 className="r-title-lg" style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:54px;max-width:760px;line-height:1.1;")}>{C.storyTitle}</h1>
        </div>
      </section>
      <section className="r-container" style={css("max-width:760px;margin:0 auto;padding:64px 32px 30px;text-align:center;")}>
        <p style={css("font-size:22px;line-height:1.7;color:#3a2c25;font-family:'Frank Ruhl Libre',serif;font-weight:300;margin-bottom:26px;")}>{C.storyLead}</p>
        <p style={css("font-size:16.5px;color:#6e5648;line-height:1.8;")}>{C.storyBody}</p>
      </section>
      <section className="r-container" style={css("max-width:1100px;margin:0 auto;padding:36px 32px;")}>
        <div className="r-grid3" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:24px;")}>
          {values.map((v, i) => (
            <div key={i} style={css("background:rgba(255,255,255,.72);border:1px solid #ecdccd;border-radius:18px;padding:32px 26px;text-align:center;")}>
              <FlowerMark width={64} height={30} sw={1.6} style={{ margin: "0 auto 16px", display: "block" }} />
              <h3 style={css("font-family:'Frank Ruhl Libre',serif;font-size:22px;margin-bottom:10px;")}>{v.title}</h3>
              <p style={css("font-size:14.5px;color:#6e5648;line-height:1.6;")}>{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={css("background:#f3e8dd;margin-top:46px;")}>
        <div className="r-container" style={css("max-width:1100px;margin:0 auto;padding:70px 32px;text-align:center;")}>
          <div style={css("font-size:48px;color:#bd7355;font-family:'Frank Ruhl Libre',serif;line-height:.5;margin-bottom:18px;")}>”</div>
          <p style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:34px;line-height:1.35;max-width:720px;margin:0 auto;")}>{C.storyQuote}</p>
        </div>
      </section>
      <section className="r-container r-split" style={css("max-width:1100px;margin:0 auto;padding:70px 32px;display:grid;grid-template-columns:1fr 1fr;gap:54px;align-items:center;")}>
        <div>
          <div style={css("font-size:13px;letter-spacing:.2em;color:#bd7355;margin-bottom:12px;")}>התהליך</div>
          <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:38px;margin-bottom:18px;")}>{C.processTitle}</h2>
          <p style={css("font-size:16.5px;color:#6e5648;margin-bottom:24px;line-height:1.8;")}>{C.processText}</p>
          <button onClick={() => go("catalog")} style={css("padding:14px 30px;background:#bd7355;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;")}>לקולקציה ←</button>
        </div>
        <div style={css(`aspect-ratio:4/3;border-radius:18px;background:url(${C.storyImage || "floral-bg.jpg"}) center/cover;box-shadow:0 20px 50px rgba(140,90,60,.12);`)} />
      </section>
    </div>
  );
}
