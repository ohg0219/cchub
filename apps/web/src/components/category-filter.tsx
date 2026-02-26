'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

const CATEGORIES = ['backend', 'frontend', 'data', 'devops', 'mobile', 'fullstack'] as const;
const HAS_OPTIONS = ['skills', 'hooks', 'agents', 'claude_md'] as const;

interface CategoryFilterProps {
  defaultCategory?: string;
  defaultHas?: string[];
  defaultSort?: string;
}

export function CategoryFilter({ defaultCategory = '', defaultHas = [], defaultSort = 'popular' }: CategoryFilterProps) {
  const t = useTranslations('explore');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const push = (params: URLSearchParams) => {
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const setCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set('category', cat);
    else params.delete('category');
    push(params);
  };

  const toggleHas = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get('has')?.split(',').filter(Boolean) ?? [];
    const next = current.includes(key) ? current.filter((v) => v !== key) : [...current, key];
    if (next.length) params.set('has', next.join(','));
    else params.delete('has');
    push(params);
  };

  const setSort = (s: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (s !== 'popular') params.set('sort', s);
    else params.delete('sort');
    push(params);
  };

  const activeCategory = searchParams.get('category') ?? defaultCategory;
  const activeHas = (searchParams.get('has') ?? defaultHas.join(',')).split(',').filter(Boolean);
  const activeSort = searchParams.get('sort') ?? defaultSort;

  return (
    <div className="flex flex-col gap-3">
      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !activeCategory ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {t('allCategories')}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === activeCategory ? '' : cat)}
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
              activeCategory === cat ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 구성 필터 + 정렬 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-3">
          {HAS_OPTIONS.map((key) => {
            const labelKey = key === 'claude_md' ? 'claudeMd' : key;
            return (
              <label key={key} className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={activeHas.includes(key)}
                  onChange={() => toggleHas(key)}
                  className="accent-white"
                />
                {t(`filters.${labelKey}`)}
              </label>
            );
          })}
        </div>

        <div className="ml-auto flex gap-1 rounded-lg border border-gray-700 p-0.5">
          {(['popular', 'latest'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeSort === s ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t(`sort.${s}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
