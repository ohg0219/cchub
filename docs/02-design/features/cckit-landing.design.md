# cckit-landing Design Document

> **Summary**: CCKit 랜딩 페이지 구현 — Hero/통계/인기킷/CTA/푸터 + i18n
>
> **Project**: CCKit
> **Version**: 0.1.0
> **Author**: CCKit Team
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [cckit-landing.plan.md](../01-plan/features/cckit-landing.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 랜딩 페이지 전체 섹션을 Server Component 기반으로 SSR 렌더링 (SEO + 초기 로드 최적화)
- GlobalNav는 이미 구현 완료 (`components/global-nav.tsx`) — 변경 없음
- 신규 컴포넌트 최소화: KitCard, CliBlock, StatsSection, Footer (4개)
- 모든 사용자 노출 문자열은 `ko.json` / `en.json`으로 관리

### 1.2 Design Principles

- Server Component 우선 — 클라이언트 인터랙션이 필요한 곳만 `'use client'`
- Tailwind CSS 4 utility classes만 사용, inline styles 금지
- 컴포넌트는 named export + 함수형
- i18n 문자열 하드코딩 금지

---

## 2. Architecture

### 2.1 컴포넌트 다이어그램

```
[locale]/page.tsx (Server Component)
├── <StatsSection />     (Server Component — Supabase 조회)
├── <HeroSection />      (Server Component — 정적 콘텐츠)
├── <PopularKitsSection /> (Server Component — Supabase 조회)
│   └── <KitCard />      (Server Component)
├── <CliCtaSection />    (Server Component + 내부 CliBlock Client)
│   └── <CliBlock />     ('use client' — 클립보드 API)
└── <Footer />           (Server Component — 정적 링크)
```

### 2.2 데이터 흐름

```
page.tsx (SSR)
  → statsQuery: SELECT COUNT(*), SUM(install_count) FROM kits WHERE is_published
  → popularKitsQuery: SELECT ... FROM kits WHERE is_published ORDER BY install_count DESC LIMIT 6
  → props 전달 → StatsSection, PopularKitsSection
```

### 2.3 의존 관계

| 컴포넌트 | 의존 | 목적 |
|---------|------|------|
| `page.tsx` | Supabase server client | 통계 + 인기 킷 조회 |
| `StatsSection` | `next-intl/server` | i18n 텍스트 |
| `KitCard` | 없음 | 킷 메타 렌더링 |
| `CliBlock` | `'use client'` | 클립보드 복사 |
| `Footer` | `next-intl/server` | i18n 텍스트 |

---

## 3. Data Model

### 3.1 페이지에서 사용하는 Supabase 데이터

```typescript
// 통계 집계 결과
interface LandingStats {
  kitCount: number;
  totalInstalls: number;
  categoryCount: number;  // DISTINCT category 수
}

// 인기 킷 카드용 (상세 불필요)
interface KitSummary {
  id: string;
  slug: string;
  name: string;
  description: string;   // max 200자
  category: string;      // 'backend' | 'frontend' | 'data' | 'devops' | 'mobile' | 'fullstack'
  install_count: number;
  skills_count: number;
  hooks_count: number;
  agents_count: number;
  has_claude_md: boolean;
  tags: string[];
}
```

### 3.2 Supabase 쿼리

```typescript
// 통계 쿼리 — server component에서 직접 호출
const { data: statsData } = await supabase
  .from('kits')
  .select('install_count, category')
  .eq('is_published', true);

// install_count 합산, category 종류 수 → 클라이언트 집계

// 인기 킷 쿼리
const { data: popularKits } = await supabase
  .from('kits')
  .select('id, slug, name, description, category, install_count, skills_count, hooks_count, agents_count, has_claude_md, tags')
  .eq('is_published', true)
  .order('install_count', { ascending: false })
  .limit(6);
```

---

## 4. API Specification

랜딩 페이지는 Route Handler를 사용하지 않고 서버 컴포넌트에서 Supabase를 직접 조회합니다.
(별도 API 엔드포인트 불필요)

---

## 5. UI/UX Design

### 5.1 전체 페이지 레이아웃

```
┌─────────────────────────────────────────────┐
│ GlobalNav (sticky, z-40)                    │
│  CCKit  |  킷 탐색  |  킷 등록  |  [로그인] │
├─────────────────────────────────────────────┤
│ HeroSection                                 │
│   "Claude Code 인프라를 한 번에"            │
│   [킷 탐색하기]  [GitHub으로 시작하기]      │
├─────────────────────────────────────────────┤
│ StatsSection (3 columns)                    │
│   [킷 수]   [총 설치 수]   [카테고리 수]    │
├─────────────────────────────────────────────┤
│ PopularKitsSection                          │
│   "인기 킷" + [더 보기 →]                  │
│   ┌──────┐ ┌──────┐ ┌──────┐              │
│   │KitCard│ │KitCard│ │KitCard│             │
│   └──────┘ └──────┘ └──────┘              │
│   ┌──────┐ ┌──────┐ ┌──────┐              │
│   │KitCard│ │KitCard│ │KitCard│             │
│   └──────┘ └──────┘ └──────┘              │
├─────────────────────────────────────────────┤
│ CliCtaSection                               │
│   "터미널 한 줄로 설치"                     │
│   ┌─────────────────────────────────────┐  │
│   │ $ npx cckit install spring-boot-... │📋│
│   └─────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│ Footer                                      │
│  CCKit © 2026  |  GitHub  |  문서  |  등록  │
└─────────────────────────────────────────────┘
```

### 5.2 컴포넌트 상세 스펙

#### HeroSection

```
배경: bg-gradient-to-b from-gray-950 to-gray-900
패딩: py-24 (데스크톱), py-16 (모바일)
중앙 정렬: text-center

제목: text-5xl font-bold text-white (데스크톱)
      text-3xl (모바일)
      내용: t('home.title') = "Claude Code 인프라를 한 번에"

부제목: text-xl text-gray-400 mt-4 max-w-2xl mx-auto
        내용: t('home.subtitle')

CTA 버튼 2개 (mt-8 flex gap-4 justify-center):
  - 탐색 버튼: bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold
               href="/explore"
  - GitHub 버튼: bg-gray-800 border border-gray-600 text-white px-6 py-3 rounded-lg
                 href="/auth/login" (로그인 = GitHub OAuth)
```

#### StatsSection

```
배경: border-y border-gray-800 bg-gray-900/50 py-12
그리드: grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center

각 stat:
  숫자: text-4xl font-bold text-white (애니메이션 없음, SSR)
  라벨: text-sm text-gray-400 mt-2

항목:
  - 전체 킷 수: {kitCount.toLocaleString()}개
  - 총 설치 수: {totalInstalls.toLocaleString()}회
  - 카테고리 수: {categoryCount}개

데이터 없음(시드 전): 0으로 표시 (에러 처리)
```

#### KitCard

```typescript
// props
interface KitCardProps {
  kit: KitSummary;
}

// 레이아웃
카드: rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-600 transition-colors
      cursor-pointer (전체 클릭 → /kit/[slug])

상단: 카테고리 배지 (text-xs px-2 py-0.5 rounded-full)
      카테고리별 색상:
        backend → bg-blue-950 text-blue-400
        frontend → bg-purple-950 text-purple-400
        data → bg-green-950 text-green-400
        devops → bg-orange-950 text-orange-400
        mobile → bg-pink-950 text-pink-400
        fullstack → bg-cyan-950 text-cyan-400

이름: text-base font-semibold text-white mt-2
설명: text-sm text-gray-400 mt-1 line-clamp-2

구성 배지 (mt-3 flex gap-2 flex-wrap):
  - skills_count > 0 → "Skills ×N" 배지 (bg-gray-800 text-gray-300 text-xs)
  - hooks_count > 0  → "Hooks ×N" 배지
  - agents_count > 0 → "Agents ×N" 배지
  - has_claude_md    → "CLAUDE.md" 배지

하단: install_count 표시 (↓ N회 설치)
      text-xs text-gray-500 mt-3
```

#### CliBlock (Client Component)

```typescript
'use client';

interface CliBlockProps {
  command: string;  // "npx cckit install spring-boot-enterprise"
}

// 레이아웃
컨테이너: rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-between px-4 py-3 font-mono text-sm

왼쪽: <span className="text-gray-500">$</span>
      <span className="text-green-400 ml-2">{command}</span>

오른쪽: 복사 버튼 (onClick → navigator.clipboard.writeText)
        기본: 클립보드 아이콘 (텍스트: "복사")
        복사 후 2초: "복사됨 ✓" 표시 후 원복
        className: text-gray-400 hover:text-white transition-colors
```

#### Footer

```
배경: border-t border-gray-800 bg-gray-950 py-8
내용: flex justify-between items-center max-w-6xl mx-auto px-4

왼쪽: text-sm text-gray-500 "CCKit © 2026"
오른쪽: 링크 3개 (text-sm text-gray-400 hover:text-white)
         - GitHub (외부 링크)
         - 문서 (추후)
         - 킷 등록 → /submit
```

### 5.3 반응형 브레이크포인트

| 구간 | 인기 킷 그리드 | Hero 제목 크기 | Stat 레이아웃 |
|------|--------------|--------------|-------------|
| < 640px (mobile) | 1열 | text-3xl | grid-cols-3 (숫자 작게) |
| 640–1024px (tablet) | 2열 | text-4xl | grid-cols-3 |
| > 1024px (desktop) | 3열 | text-5xl | grid-cols-3 |

모바일에서 인기 킷은 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

---

## 6. Error Handling

| 상황 | 처리 방법 |
|------|----------|
| Supabase 통계 조회 실패 | kitCount=0, totalInstalls=0, categoryCount=0 표시 (silent fail) |
| 인기 킷 조회 실패 / 빈 데이터 | "아직 등록된 킷이 없습니다. 첫 킷을 등록해보세요!" Empty State + 등록 버튼 |
| 클립보드 API 미지원 | 복사 버튼 숨김 또는 `document.execCommand` fallback |

---

## 7. Security Considerations

- [ ] 랜딩 페이지는 인증 불필요 — Supabase RLS `is_published = true` 공개 조회만 사용
- [ ] XSS: 모든 데이터는 JSX 이스케이프 자동 처리, `dangerouslySetInnerHTML` 미사용
- [ ] i18n 키 직접 출력 없음 (누락 키는 fallback 텍스트)

---

## 8. Implementation Guide

### 8.1 신규 생성 파일

```
apps/web/src/
├── app/[locale]/
│   └── page.tsx                    # 랜딩 페이지 (신규)
├── components/
│   ├── kit-card.tsx                # KitCard (신규)
│   ├── cli-block.tsx               # CliBlock - 'use client' (신규)
│   └── footer.tsx                  # Footer (신규)
└── messages/
    ├── ko.json                     # landing, stats, footer 키 추가
    └── en.json                     # 동일 구조 영어
```

> **StatsSection**: `page.tsx` 내부 인라인 섹션 컴포넌트로 구현 (별도 파일 불필요)
> **HeroSection**: `page.tsx` 내부 인라인 섹션 컴포넌트로 구현
> **CliCtaSection**: `page.tsx` 내부 + `<CliBlock />` import

### 8.2 i18n 추가 키 (ko.json)

```json
{
  "home": {
    "title": "Claude Code 인프라를 한 번에",
    "subtitle": "Skills + Hooks + Agents + CLAUDE.md를 원클릭으로 설치하는 스타터 킷 마켓플레이스",
    "cta": {
      "explore": "킷 탐색하기",
      "github": "GitHub으로 시작하기"
    },
    "stats": {
      "kits": "개의 스타터 킷",
      "installs": "회 설치됨",
      "categories": "개 카테고리"
    },
    "popularKits": {
      "title": "인기 킷",
      "viewAll": "모두 보기",
      "empty": "아직 등록된 킷이 없습니다. 첫 킷을 등록해보세요!",
      "registerFirst": "킷 등록하기"
    },
    "cliCta": {
      "title": "터미널 한 줄로 설치",
      "subtitle": "Claude Code가 설치된 어떤 프로젝트에도 즉시 적용"
    }
  },
  "footer": {
    "copyright": "© 2026 CCKit",
    "github": "GitHub",
    "docs": "문서",
    "submit": "킷 등록"
  }
}
```

### 8.3 구현 순서

1. [ ] `ko.json` / `en.json` i18n 키 추가
2. [ ] `components/footer.tsx` 구현 (정적 컴포넌트, 가장 단순)
3. [ ] `components/kit-card.tsx` 구현 (KitSummary 타입 기반)
4. [ ] `components/cli-block.tsx` 구현 (클립보드 복사 Client Component)
5. [ ] `app/[locale]/page.tsx` 구현:
   - Supabase 통계 쿼리
   - Supabase 인기 킷 쿼리
   - HeroSection 인라인 구현
   - StatsSection 인라인 구현
   - PopularKitsSection + KitCard 렌더링
   - CliCtaSection + CliBlock 렌더링
   - Footer 렌더링
6. [ ] GlobalNav에 locale-aware `Link` 적용 확인 (현재 `<a>` 태그 사용 중)

### 8.4 GlobalNav 개선 사항

현재 `global-nav.tsx`는 `<a href="/explore">` 사용 중 → `next-intl`의 `Link`로 교체 필요:

```typescript
import { Link } from '@/i18n/routing';  // next-intl routing Link

// 변경 전
<a href="/explore" ...>

// 변경 후
<Link href="/explore" ...>
```

---

## 9. 타입 정의

```typescript
// apps/web/src/lib/supabase/types.ts 에 추가
export interface KitSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'backend' | 'frontend' | 'data' | 'devops' | 'mobile' | 'fullstack';
  install_count: number;
  skills_count: number;
  hooks_count: number;
  agents_count: number;
  has_claude_md: boolean;
  tags: string[];
}

export interface LandingStats {
  kitCount: number;
  totalInstalls: number;
  categoryCount: number;
}
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft | CCKit Team |
