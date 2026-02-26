import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <span className="text-sm text-gray-500">{t('copyright')}</span>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/cckit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('github')}
          </a>
          <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
            {t('docs')}
          </Link>
          <Link href="/submit" className="text-sm text-gray-400 hover:text-white transition-colors">
            {t('submit')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
