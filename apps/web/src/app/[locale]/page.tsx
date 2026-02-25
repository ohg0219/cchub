import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
      <p className="text-lg text-gray-400">{t('subtitle')}</p>
      <div className="mt-4 flex gap-3">
        <a
          href="/explore"
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          {t('cta.explore')}
        </a>
        <a
          href="/submit"
          className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
        >
          {t('cta.submit')}
        </a>
      </div>
    </main>
  );
}
