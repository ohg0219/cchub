import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import type { KitSummary, LandingStats } from '@/lib/supabase/types';
import { KitCard } from '@/components/kit-card';
import { CliBlock } from '@/components/cli-block';
import Footer from '@/components/footer';

async function fetchLandingData(): Promise<{ stats: LandingStats; popularKits: KitSummary[] }> {
  try {
    const supabase = await createClient();

    const [statsResult, kitsResult] = await Promise.all([
      supabase
        .from('kits')
        .select('install_count, category')
        .eq('is_published', true),
      supabase
        .from('kits')
        .select(
          'id, slug, name, description, category, install_count, skills_count, hooks_count, agents_count, has_claude_md, tags'
        )
        .eq('is_published', true)
        .order('install_count', { ascending: false })
        .limit(6),
    ]);

    const rows = statsResult.data ?? [];
    const stats: LandingStats = {
      kitCount: rows.length,
      totalInstalls: rows.reduce((sum, r) => sum + (r.install_count ?? 0), 0),
      categoryCount: new Set(rows.map((r) => r.category)).size,
    };

    return { stats, popularKits: (kitsResult.data as KitSummary[]) ?? [] };
  } catch {
    return {
      stats: { kitCount: 0, totalInstalls: 0, categoryCount: 0 },
      popularKits: [],
    };
  }
}

export default async function HomePage() {
  const t = await getTranslations('home');
  const { stats, popularKits } = await fetchLandingData();

  return (
    <>
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-950 to-gray-900 py-24 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-5xl font-bold text-white max-sm:text-3xl">{t('title')}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-400 max-sm:text-base">
              {t('subtitle')}
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link
                href="/explore"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                {t('cta.explore')}
              </Link>
              <Link
                href="/auth/login"
                className="rounded-lg border border-gray-600 bg-gray-800 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
              >
                {t('cta.github')}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-gray-800 bg-gray-900/50 py-12">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8 px-4 text-center">
            <div>
              <p className="text-4xl font-bold text-white max-sm:text-2xl">
                {stats.kitCount.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-gray-400">{t('stats.kits')}</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white max-sm:text-2xl">
                {stats.totalInstalls.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-gray-400">{t('stats.installs')}</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white max-sm:text-2xl">
                {stats.categoryCount}
              </p>
              <p className="mt-2 text-sm text-gray-400">{t('stats.categories')}</p>
            </div>
          </div>
        </section>

        {/* Popular Kits */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{t('popularKits.title')}</h2>
            <Link
              href="/explore"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t('popularKits.viewAll')} →
            </Link>
          </div>

          {popularKits.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 py-16 text-center">
              <p className="text-gray-400">{t('popularKits.empty')}</p>
              <Link
                href="/submit"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
              >
                {t('popularKits.registerFirst')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularKits.map((kit) => (
                <KitCard key={kit.id} kit={kit} />
              ))}
            </div>
          )}
        </section>

        {/* CLI CTA */}
        <section className="border-t border-gray-800 bg-gray-900/30 py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl font-bold text-white">{t('cliCta.title')}</h2>
            <p className="mt-2 text-gray-400">{t('cliCta.subtitle')}</p>
            <div className="mt-6 text-left">
              <CliBlock command="npx cckit install spring-boot-enterprise" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
