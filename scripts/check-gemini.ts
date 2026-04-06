/**
 * 로컬 .env.local 을 읽고 Gemini 카드뉴스 생성 1회 호출로 연동 여부 확인.
 * 실행: npx tsx scripts/check-gemini.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

loadEnvLocal();

async function main() {
  const { generateCardNewsText } = await import("../lib/gemini");
  const key = process.env.GEMINI_API_KEY?.replace(/^["']|["']$/g, "").trim();
  if (!key) {
    console.error("FAIL: .env.local 에 GEMINI_API_KEY 가 없습니다.");
    process.exit(1);
  }

  const r = await generateCardNewsText({
    category: "test",
    keyword: "연동 확인",
    language: "ko",
  });

  if (!r.title?.trim() || !r.body?.trim()) {
    console.error("FAIL: 응답 title/body 가 비어 있습니다.");
    process.exit(1);
  }

  console.log("OK: Gemini API 연동 성공 (generateCardNewsText)");
  console.log("  title:", r.title.slice(0, 100) + (r.title.length > 100 ? "…" : ""));
  console.log(
    "  body:",
    r.body.split("\n")[0]?.slice(0, 80) + (r.body.length > 80 ? "…" : "")
  );
}

main().catch((e) => {
  console.error("FAIL:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
