import type { ReactNode } from "react";

type ControlsProps = {
  category: string;
  language: string;
  keyword: string;
  onCategoryChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  /** 키워드 입력칸 옆에 표시 (예: 생성하기 버튼) */
  generateButton?: ReactNode;
};

const controlClass =
  "min-w-0 rounded-lg border border-gray-700 bg-[#111] px-4 py-2 text-sm text-white shadow-sm outline-none transition placeholder:text-zinc-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-600";

/** 카테고리 select 옵션 (표시·API 전달 값 동일) */
export const EDITOR_CATEGORY_OPTIONS = [
  "자기계발",
  "경제 / 재테크",
  "커리어 / 취업",
  "트렌드 / 이슈",
  "라이프스타일",
  "인간관계 / 연애",
  "마케팅",
  "디자인",
  "패션",
  "AI / 기술",
] as const;

export function Controls({
  category,
  language,
  keyword,
  onCategoryChange,
  onLanguageChange,
  onKeywordChange,
  generateButton,
}: ControlsProps) {
  return (
    <section
      className="mt-6 flex flex-row flex-wrap items-center justify-center gap-4"
      aria-label="카테고리·언어·키워드"
    >
      <select
        id="editor-category"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={`${controlClass} min-w-[12rem] max-w-[min(100%,20rem)]`}
        aria-label="카테고리"
      >
        {EDITOR_CATEGORY_OPTIONS.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>
      <select
        id="editor-language"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className={controlClass}
        aria-label="언어"
      >
        <option value="ko">한국어</option>
        <option value="en">English</option>
      </select>
      <div className="flex min-w-0 w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:flex-1 sm:min-w-[min(100%,28rem)]">
        <input
          id="editor-keyword"
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="키워드 (뉴스 주제)"
          className={`${controlClass} min-w-[min(100%,12rem)] flex-1 sm:max-w-md`}
          aria-label="키워드"
        />
        {generateButton}
      </div>
    </section>
  );
}
