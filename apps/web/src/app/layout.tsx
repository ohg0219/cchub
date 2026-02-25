// 루트 레이아웃 — next-intl이 [locale]/layout.tsx에서 처리
// 이 파일은 Next.js App Router 요구사항으로 존재
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
