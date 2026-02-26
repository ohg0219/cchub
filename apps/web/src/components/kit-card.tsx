import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { KitSummary } from '@/lib/supabase/types';

const CATEGORY_STYLES: Record<KitSummary['category'], string> = {
  backend: 'bg-blue-950 text-blue-400',
  frontend: 'bg-purple-950 text-purple-400',
  data: 'bg-green-950 text-green-400',
  devops: 'bg-orange-950 text-orange-400',
  mobile: 'bg-pink-950 text-pink-400',
  fullstack: 'bg-cyan-950 text-cyan-400',
};

const CATEGORY_LABELS: Record<KitSummary['category'], string> = {
  backend: 'Backend',
  frontend: 'Frontend',
  data: 'Data',
  devops: 'DevOps',
  mobile: 'Mobile',
  fullstack: 'Fullstack',
};

interface KitCardProps {
  kit: KitSummary;
}

export async function KitCard({ kit }: KitCardProps) {
  const t = await getTranslations('kitCard');

  return (
    <Link
      href={`/kit/${kit.slug}`}
      className="block rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-600 transition-colors"
    >
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[kit.category]}`}
      >
        {CATEGORY_LABELS[kit.category]}
      </span>

      <h3 className="mt-2 text-base font-semibold text-white">{kit.name}</h3>
      <p className="mt-1 text-sm text-gray-400 line-clamp-2">{kit.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {kit.skills_count > 0 && (
          <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
            Skills ×{kit.skills_count}
          </span>
        )}
        {kit.hooks_count > 0 && (
          <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
            Hooks ×{kit.hooks_count}
          </span>
        )}
        {kit.agents_count > 0 && (
          <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
            Agents ×{kit.agents_count}
          </span>
        )}
        {kit.has_claude_md && (
          <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">CLAUDE.md</span>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        ↓ {t('installs', { count: kit.install_count.toLocaleString() })}
      </p>
    </Link>
  );
}
