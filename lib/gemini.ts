import { GoogleGenerativeAI, type RequestOptions } from "@google/generative-ai";

/**
 * 기본: https://generativelanguage.googleapis.com
 * 프록시·다른 리전 엔드포인트를 쓸 때만 .env에 설정 (끝의 / 는 붙이지 않는 것을 권장)
 */
function getGeminiRequestOptions(): RequestOptions | undefined {
  const raw = process.env.GEMINI_API_BASE_URL?.replace(/^["']|["']$/g, "").trim();
  if (!raw) return undefined;
  return { baseUrl: raw };
}

export type ToneOption = "감성" | "위로" | "응원";
export type LengthOption = "짧게" | "보통";

export type GenerateTextInput = {
  tone: ToneOption;
  length: LengthOption;
  situation?: string;
};

/** Google AI Studio / Vertex 등에서 쓰는 모델명. 필요 시 변경하세요. */
const GEMINI_MODEL = "gemini-2.0-flash";

function handleGeminiError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  const short = msg.slice(0, 280);
  if (/API[_ ]?key|API_KEY|PERMISSION_DENIED|401|403/i.test(msg)) {
    throw new Error(
      "Gemini API 키가 거부되었거나 권한이 없습니다. aistudio.google.com/apikey 에서 발급한 키를 GEMINI_API_KEY에 넣었는지 확인하세요."
    );
  }
  if (/RESOURCE_EXHAUSTED|429|quota|Quota/i.test(msg)) {
    throw new Error(
      "Gemini 무료 한도(분당·일당 요청 수)에 도달했습니다. 몇 분~몇 시간 뒤에 다시 시도하거나, Google AI Studio에서 사용량·결제(유료 한도)를 확인하세요."
    );
  }
  if (/not found|NOT_FOUND|404|is not supported|Invalid model/i.test(msg)) {
    throw new Error(
      `모델(${GEMINI_MODEL})을 사용할 수 없습니다. Google AI Studio에서 해당 모델 사용 가능 여부를 확인하거나 lib/gemini.ts의 GEMINI_MODEL을 gemini-1.5-flash 등으로 바꿔 보세요. (${short})`
    );
  }
  throw new Error(`Gemini 오류: ${short}`);
}

function buildUserPrompt(input: GenerateTextInput): string {
  const situationPart = input.situation?.trim()
    ? `상황/맥락: "${input.situation.trim()}"`
    : "상황은 특정하지 않아도 됩니다. 톤에 맞는 공감 문장을 써 주세요.";

  const lengthGuide =
    input.length === "짧게"
      ? "전체가 아주 간결하게, 2~3줄 정도로 짧게."
      : "2~4줄, ‘보통’ 길이로 여유 있게.";

  return [
    `톤: ${input.tone}`,
    situationPart,
    lengthGuide,
    "위 규칙에 맞는 결과만 한국어로 출력하세요.",
  ].join("\n");
}

const SYSTEM_PROMPT = `당신은 인스타그램 감성 캡션을 쓰는 카피라이터입니다.
반드시 지킬 것:
- 한국어, 2~4줄. 줄바꿈(\\n)으로 구분.
- 따뜻하고 공감 가는 말투. 질책·명령·공격적인 조언 금지.
- 전체 글자 수(공백 포함) 100자 미만.
- 이모지는 전체에서 0개 또는 1개만 (없어도 됨).
- 마지막 한 줄은 짧고 여운 있게 마무리.
출력은 본문 텍스트만. 따옴표나 설명, 접두어 없이.`;

export async function generateInstagramText(
  input: GenerateTextInput
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/^["']|["']$/g, "").trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY가 설정되어 있지 않습니다. .env.local을 저장한 뒤 dev 서버를 재시작했는지 확인하세요."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    {
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT,
    },
    getGeminiRequestOptions()
  );

  let raw = "";
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(input) }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 256,
      },
    });
    raw = result.response.text().trim();
  } catch (err) {
    handleGeminiError(err);
  }

  if (!raw) {
    throw new Error("모델 응답이 비어 있거나 차단되었습니다. 잠시 후 다시 시도해 주세요.");
  }

  let text = raw.replace(/^["']|["']$/g, "").trim();
  if (text.length >= 100) {
    text = text.slice(0, 99);
  }
  return text;
}

export type CardNewsInput = {
  category: string;
  keyword: string;
  language: "ko" | "en";
};

const CARDNEWS_SYSTEM = `당신은 SNS 인스타그램용 '카드뉴스' 카피를 쓰는 에디터입니다.
반드시 출력은 JSON 한 개만 (앞뒤 설명·마크다운·코드펜스 금지).
형식: {"title":"한 줄 제목","body":"본문"}
규칙:
- title: 짧고 강렬하게 한 줄.
- body: 2~4줄. 줄바꿈은 \\n 으로 구분.
- 뉴스 요약 느낌 + 트렌디하고 자연스러운 문장. 지나치게 딱딱한 어조는 피할 것.
- 언어는 사용자 요청에 맞춤 (한국어 또는 영어).`;

function stripCodeFence(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return t.trim();
}

export async function generateCardNewsText(
  input: CardNewsInput
): Promise<{ title: string; body: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/^["']|["']$/g, "").trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY가 설정되어 있지 않습니다. .env.local을 저장한 뒤 dev 서버를 재시작했는지 확인하세요."
    );
  }

  const langLine =
    input.language === "en"
      ? "출력 언어: English (title and body both in English)."
      : "출력 언어: 한국어.";

  const userPrompt = [
    langLine,
    `카테고리: ${input.category}`,
    `키워드/주제: ${input.keyword.trim()}`,
    "위 키워드를 바탕으로 최신 이슈·트렌드를 염두에 둔 카드뉴스용 제목과 본문을 JSON으로만 출력하세요.",
  ].join("\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    {
      model: GEMINI_MODEL,
      systemInstruction: CARDNEWS_SYSTEM,
    },
    getGeminiRequestOptions()
  );

  let raw = "";
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 512,
      },
    });
    raw = result.response.text().trim();
  } catch (err) {
    handleGeminiError(err);
  }

  if (!raw) {
    throw new Error("모델 응답이 비어 있거나 차단되었습니다.");
  }

  let parsed: { title?: unknown; body?: unknown };
  try {
    parsed = JSON.parse(stripCodeFence(raw)) as { title?: unknown; body?: unknown };
  } catch {
    throw new Error("모델이 올바른 JSON을 반환하지 않았습니다. 다시 시도해 주세요.");
  }

  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
  if (!title || !body) {
    throw new Error("생성된 제목·본문이 비어 있습니다. 다시 시도해 주세요.");
  }

  return { title, body };
}
