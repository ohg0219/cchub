import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { KitCard } from '@/components/kit-card';
import { SearchBar } from '@/components/search-bar';
import { CategoryFilter } from '@/components/category-filter';
import { Link } from '@/i18n/routing';
import type { KitSummary } from '@/lib/supabase/types';

const VALID_CATEGORIES = ['backend', 'frontend', 'data', 'devops', 'mobile', 'fullstack'];
const PAGE_SIZE = 12;

interface SearchParams {
  q?: string;
  category?: string;
  has?: string;
  sort?: string;
  page?: string;
}

async function fetchKits(searchParams: SearchParams) {
  try {
    const supabase = await createClient();

    const q = searchParams.q ?? '';
    const category = VALID_CATEGORIES.includes(searchParams.category ?? '') ? (searchParams.category ?? '') : '';
    const has = searchParams.has ?? '';
    const sort = searchParams.sort === 'latest' ? 'latest' : 'popular';
    const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));

    let query = supabase
      .from('kits')
      .select(
        'id,slug,name,description,category,install_count,skills_count,hooks_count,agents_count,has_claude_md,tags',
        { count: 'exact' }
      )
      .eq('is_published', true);

    if (q) query = query.textSearch('fts', q, { type: 'plain', config: 'simple' });
    if (category) query = query.eq('category', category);
    if (has.includes('skills'))    query = query.gt('skills_count', 0);
    if (has.includes('hooks'))     query = query.gt('hooks_count', 0);
    if (has.includes('agents'))    query = query.gt('agents_count', 0);
    if (has.includes('claude_md')) query = query.eq('has_claude_md', true);

    if (sort === 'latest') query = query.order('created_at', { ascending: false });
    else                   query = query.order('install_count', { ascending: false });

    query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const { data, count } = await query;
    return { kits: (data as KitSummary[]) ?? [], total: count ?? 0, page };
  } catch {
    return { kits: [], total: 0, page: 1 };
  }
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const t = await getTranslations('explore');
  const { kits, total, page } = await fetchKits(params);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-white">{t('title')}</h1>

        {/* 검색 + 필터 */}
        <div className="mb-8 flex flex-col gap-4">
          <SearchBar defaultValue={params.q} />
          <CategoryFilter
            defaultCategory={params.category}
            defaultHas={params.has?.split(',').filter(Boolean)}
            defaultSort={params.sort}
          />
        </div>

        {/* 결과 수 */}
        {total > 0 && (
          <p className="mb-4 text-sm text-gray-400">{t('total', { count: total })}</p>
        )}

        {/* 킷 그리드 */}
        {kits.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-lg font-medium text-gray-300">{t('empty')}</p>
            <p className="text-sm text-gray-500">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kits.map((kit) => (
              <KitCard key={kit.id} kit={kit} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {page > 1 && (
              <PaginationLink params={params} targetPage={page - 1} label="←" />
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationLink
                key={p}
                params={params}
                targetPage={p}
                label={String(p)}
                active={p === page}
              />
            ))}
            {page < totalPages && (
              <PaginationLink params={params} targetPage={page + 1} label="→" />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function PaginationLink({
  params,
  targetPage,
  label,
  active,
}: {
  params: SearchParams;
  targetPage: number;
  label: string;
  active?: boolean;
}) {
  const query = new URLSearchParams();
  if (params.q)        query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.has)      query.set('has', params.has);
  if (params.sort)     query.set('sort', params.sort);
  if (targetPage > 1)  query.set('page', String(targetPage));
  const href = `/explore${query.size ? `?${query.toString()}` : ''}`;

  return (
    <Link
      href={href}
      className={`flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm transition-colors ${
        active
          ? 'bg-white font-semibold text-gray-900'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label}
    </Link>
  );
}
