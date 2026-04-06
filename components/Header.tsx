export function Header() {
  return (
    <header className="mt-10 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
        인스타 카드뉴스 생성기
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
        이미지와 키워드만 넣으면 AI가 뉴스형 카드 문구를 만들고, 바로 합성·다운로드할 수
        있어요
      </p>
    </header>
  );
}
