import React from "react";
import { css } from "../lib/css.js";
import { FlowerMark } from "../components/Ornaments.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";

export function Story() {
  const { content: C, go } = useStore();
  const values = [
    { title: C.value1Title, text: C.value1Text },
    { title: C.value2Title, text: C.value2Text },
    { title: C.value3Title, text: C.value3Text },
  ];
  const heroImg = C.storyHeroImage || C.storyImage || "floral-bg.jpg";

  useSeoTags({
    title: "הסיפור שלנו · ALFI",
    description: C.storyLead ? C.storyLead.slice(0, 155) : "הסיפור של ALFI — תכשיטי כסף סטרלינג 925 באיכות אמיתית ובמחיר נגיש.",
    canonical: "/הסיפור-שלנו",
  });

  return (
    <div>
      <section className="r-hero" style={css("position:relative;width:100%;min-height:clamp(300px,50vw,460px);")}>
        <div style={css(`position:absolute;inset:0;background:url("${heroImg}") center/cover;`)} />
        <div style={css("position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(rgba(250,245,239,.34),rgba(250,245,239,.6));padding:var(--sp-5);")}>
          <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-display);max-width:760px;line-height:1.1;")}>{C.storyTitle}</h1>
        </div>
      </section>
      <section className="container" style={css("max-width:760px;margin:0 auto;padding:64px var(--sp-5) 30px;text-align:center;")}>
        <p style={css("font-size:22px;line-height:1.7;color:var(--c-ink);font-family:var(--font-serif);font-weight:300;margin-bottom:26px;")}>{C.storyLead}</p>
        <p style={css("font-size:16.5px;color:var(--c-ink-soft);line-height:1.8;")}>{C.storyBody}</p>
      </section>
      <section className="container" style={css("max-width:1100px;margin:0 auto;padding:36px var(--sp-5);")}>
        <div className="grid-3">
          {values.map((v, i) => (
            <div key={i} className="card" style={css("background:rgba(255,255,255,.72);padding:32px 26px;text-align:center;")}>
              <FlowerMark width={64} height={30} sw={1.6} style={{ margin: "0 auto 16px", display: "block" }} />
              <h2 style={css("font-family:var(--font-serif);font-size:21px;margin-bottom:10px;")}>{v.title}</h2>
              <p style={css("font-size:14.5px;color:var(--c-ink-soft);line-height:1.6;")}>{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={css("background:var(--c-line-soft);margin-top:var(--sp-7);")}>
        <div className="container" style={css("max-width:1100px;margin:0 auto;padding:70px var(--sp-5);text-align:center;")}>
          <div style={css("font-size:48px;color:var(--c-accent);font-family:var(--font-serif);line-height:.5;margin-bottom:18px;")}>”</div>
          <p style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);line-height:1.35;max-width:720px;margin:0 auto;")}>{C.storyQuote}</p>
        </div>
      </section>
      <section className="container r-split" style={css("max-width:1100px;margin:0 auto;padding:70px var(--sp-5);display:grid;grid-template-columns:1fr 1fr;gap:54px;align-items:center;")}>
        <div>
          <h2 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:18px;")}>{C.processTitle}</h2>
          <p style={css("font-size:16.5px;color:var(--c-ink-soft);margin-bottom:24px;line-height:1.8;")}>{C.processText}</p>
          <button onClick={() => go("catalog")} className="btn btn-primary">לקולקציה ←</button>
        </div>
        <div style={css(`aspect-ratio:4/3;border-radius:var(--r-lg);background:url(${C.storyImage || "floral-bg.jpg"}) center/cover;box-shadow:var(--shadow-md);`)} />
      </section>
    </div>
  );
}
