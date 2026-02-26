---
name: nextjs-patterns
description: Next.js 15 App Router 패턴 가이드 — Server/Client Components, 데이터 페칭, 라우팅
user-invocable: false
---

# Next.js 15 App Router 패턴 가이드

## Server Component vs Client Component 선택 기준

```
데이터 fetch 필요?           → Server Component
DB 직접 접근?                → Server Component
SEO 중요?                   → Server Component
useState / useEffect 사용?  → Client Component ('use client')
이벤트 핸들러 필요?           → Client Component
브라우저 API 필요?            → Client Component
```

**원칙**: 트리의 최하위 레벨에서만 Client Component 사용. 부모는 Server Component 유지.

```tsx
// 올바른 패턴: Server에서 데이터 fetch → Client에 props 전달
// app/page.tsx (Server Component)
async function Page() {
  const data = await fetchData(); // 서버에서 실행
  return <InteractiveList items={data} />; // Client Component에 전달
}

// components/interactive-list.tsx (Client Component)
'use client';
export function InteractiveList({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (/* ... */);
}
```

## 라우팅 패턴

```
app/
├── layout.tsx           # 루트 레이아웃 (항상 존재)
├── page.tsx             # / 페이지
├── loading.tsx          # 로딩 UI (Suspense fallback)
├── error.tsx            # 에러 UI (Error Boundary)
├── not-found.tsx        # 404 페이지
├── (marketing)/         # 라우트 그룹 (URL에 포함 안 됨)
│   └── about/page.tsx
├── products/
│   ├── page.tsx         # /products
│   └── [id]/
│       └── page.tsx     # /products/[id]
└── api/
    └── products/
        └── route.ts     # /api/products (Route Handler)
```

## 데이터 페칭

### Server Component
```tsx
// 기본 fetch (캐싱 포함)
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`/api/products/${params.id}`, {
    next: { revalidate: 60 }, // 60초마다 재검증
  }).then(r => r.json());

  return <ProductDetail product={product} />;
}

// DB 직접 접근 (Supabase 예시)
import { createServerClient } from '@/lib/supabase/server';

async function KitList() {
  const supabase = createServerClient();
  const { data: kits } = await supabase
    .from('kits')
    .select('*')
    .eq('is_published', true);

  return <KitGrid kits={kits ?? []} />;
}
```

### Client Component (SWR)
```tsx
'use client';
import useSWR from 'swr';

export function UserProfile() {
  const { data, error, isLoading } = useSWR('/api/me', fetcher);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage />;
  return <div>{data.username}</div>;
}
```

## Route Handler

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');

  try {
    const products = await getProducts(category);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: '조회 실패' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // 입력 검증 (zod 권장)
  const result = ProductSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }
  // ...
}
```

## 메타데이터

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const product = await getProduct(params.id);
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.imageUrl],
    },
  };
}
```

## Tailwind CSS 사용 원칙

```tsx
// 올바른 사용: utility classes 직접 사용
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
  버튼
</button>

// 반응형: mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 조건부 클래스: clsx/cn 유틸 사용
import { cn } from '@/lib/utils';
<div className={cn('base-class', isActive && 'active-class', variant === 'primary' && 'primary-class')}>
```

## 환경 변수 사용

```typescript
// 서버 전용 (절대 클라이언트 번들에 포함 금지)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 클라이언트 접근 가능
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// 타입 안전성을 위한 환경 변수 검증 (env.mjs 패턴)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}
```

## 에러 처리 패턴

```tsx
// error.tsx — 클라이언트 에러 바운더리
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>오류가 발생했습니다</h2>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```
