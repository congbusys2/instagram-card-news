import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "인스타 카드뉴스 생성기",
  description:
    "키워드로 뉴스형 카드 문구를 생성하고 이미지에 합성해 다운로드하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
