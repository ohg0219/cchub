# Next.js Fullstack — Claude Code 개발 규칙

## 프로젝트 개요

Next.js 15 App Router + TypeScript + Tailwind CSS 기반 풀스택 웹 프로젝트.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript (strict mode)
- **스타일링**: Tailwind CSS 4
- **상태관리**: React Server Components + useState/useReducer
- **DB/인증**: Supabase (또는 프로젝트에 맞게 교체)
- **배포**: Vercel

## 디렉토리 구조

```
src/
├── app/
│   ├── [locale]/           # i18n 라우팅 (선택)
│   │   ├── page.tsx
│   │   └── layout.tsx
│   └── api/                # Route Handlers
├── components/
│   ├── ui/                 # 재사용 가능한 기본 컴포넌트
│   └── features/           # 기능별 컴포넌트
├── lib/                    # 유틸리티, API 클라이언트
└── types/                  # 공유 TypeScript 타입
```

## 코딩 컨벤션

- TypeScript strict mode 필수
- 컴포넌트: 함수형 + named export (`export function ComponentName`)
- CSS: Tailwind utility classes만 사용 (inline styles 금지)
- API: Next.js Route Handlers (`app/api/*/route.ts`)
- 에러: try/catch + 사용자 친화적 메시지
- 커밋: Conventional Commits (feat:, fix:, docs:, chore:)

## Server Component vs Client Component

| 상황 | 선택 |
|------|------|
| 데이터 fetch, DB 접근 | Server Component |
| useState, useEffect 사용 | Client Component (`'use client'`) |
| 이벤트 핸들러 | Client Component |
| SEO 중요 콘텐츠 | Server Component |
| 인터랙티브 UI | Client Component |

원칙: **가능한 한 Server Component 유지. 꼭 필요할 때만 Client Component 사용.**

## 데이터 페칭 패턴

```typescript
// Server Component — fetch 직접 사용
async function Page() {
  const data = await fetch('/api/...', { cache: 'no-store' });
  return <div>{data}</div>;
}

// Client Component — SWR 또는 React Query
'use client';
const { data } = useSWR('/api/...');
```

## 환경 변수

- `NEXT_PUBLIC_` 접두사: 클라이언트에서 접근 가능
- 서버 전용 변수: 접두사 없이 사용 (절대 클라이언트 번들에 포함 금지)
- `.env.local`에 로컬 값, Vercel 대시보드에 프로덕션 값 설정
