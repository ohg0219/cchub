import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { CliBlock } from '@/components/cli-block';
import { FileTree } from '@/components/file-tree';
import { HookDiagram } from '@/components/hook-diagram';
import type { KitDetail } from '@/lib/supabase/types';

const CATEGORY_STYLES: Record<string, string> = {
  backend:  'bg-blue-950 text-blue-400',
  frontend: 'bg-purple-950 text-purple-400',
  data:     'bg-green-950 text-green-400',
  devops:   'bg-orange-950 text-orange-400',
  mobile:   'bg-pink-950 text-pink-400',
  fullstack:'bg-cyan-950 text-cyan-400',
};

async function fetchKit(slug: string): Promise<KitDetail | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('kits')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    return (data as KitDetail) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kit = await fetchKit(slug);
  if (!kit) return {};
  return {
    title: `${kit.name} — CCHub`,
    description: kit.description,
  };
}

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations('kitDetail');
  const kit = await fetchKit(slug);

  if (!kit) notFound();

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* 뒤로가기 */}
        <Link href="/explore" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
          ← {t('back')}
        </Link>

        {/* 헤더 */}
        <div className="mt-4 mb-8">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[kit.category] ?? 'bg-gray-800 text-gray-300'}`}>
              {kit.category}
            </span>
            <span className="text-sm text-gray-500">v{kit.version}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">{kit.name}</h1>
          <p className="mt-2 text-gray-400">{kit.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>{t('installs', { count: kit.install_count.toLocaleString() })}</span>
            <span>{t('stars', { count: kit.star_count })}</span>
            <a
              href={kit.github_repo}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              {t('githubLink')} ↗
            </a>
          </div>

          {kit.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {kit.tags.map((tag) => (
                <span key={tag} className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CLI 설치 블록 */}
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-400">{t('install')}</h2>
          <CliBlock command={`npx cchub install ${kit.slug}`} />
        </div>

        {/* 파일 트리 + Hook 다이어그램 */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-400">{t('fileTree')}</h2>
            {kit.file_tree ? (
              <FileTree nodes={kit.file_tree} />
            ) : (
              <p className="text-sm text-gray-600">{t('noFile')}</p>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-400">{t('hookDiagram')}</h2>
            {kit.hooks_meta?.length > 0 ? (
              <HookDiagram hooks={kit.hooks_meta} />
            ) : (
              <p className="text-sm text-gray-600">{t('noHook')}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
