import { NextResponse } from "next/server";
import {
  generateCardNewsText,
  generateInstagramText,
  type LengthOption,
  type ToneOption,
} from "@/lib/gemini";

export const runtime = "nodejs";

const TONES: ToneOption[] = ["감성", "위로", "응원"];
const LENGTHS: LengthOption[] = ["짧게", "보통"];

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "요청 본문이 올바른 JSON이 아닙니다." },
        { status: 400 }
      );
    }

    if (body.mode === "cardnews") {
      const keyword =
        typeof body.keyword === "string" ? body.keyword.trim() : "";
      if (!keyword) {
        return NextResponse.json(
          { error: "키워드를 입력해 주세요." },
          { status: 400 }
        );
      }
      const category =
        typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : "일반";
      const language = body.language === "en" ? "en" : "ko";

      const { title, body: newsBody } = await generateCardNewsText({
        category,
        keyword,
        language,
      });

      return NextResponse.json({ title, body: newsBody });
    }

    const tone = body.tone as string;
    const length = body.length as string;
    const situation =
      typeof body.situation === "string" ? body.situation : undefined;

    if (!TONES.includes(tone as ToneOption)) {
      return NextResponse.json(
        { error: "유효한 톤을 선택해 주세요." },
        { status: 400 }
      );
    }
    if (!LENGTHS.includes(length as LengthOption)) {
      return NextResponse.json(
        { error: "유효한 길이를 선택해 주세요." },
        { status: 400 }
      );
    }

    const text = await generateInstagramText({
      tone: tone as ToneOption,
      length: length as LengthOption,
      situation,
    });

    return NextResponse.json({ text });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "텍스트 생성 중 오류가 발생했습니다.";
    const userFacing =
      message.length > 0 && message.length < 400 ? message : "처리 중 오류가 발생했습니다.";
    return NextResponse.json(
      {
        error: userFacing,
        detail:
          process.env.NODE_ENV === "development" && userFacing !== message
            ? message
            : undefined,
      },
      { status: 500 }
    );
  }
}
