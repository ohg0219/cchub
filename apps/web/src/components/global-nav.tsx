import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { LoginButton } from './login-button';
import { UserMenu } from './user-menu';

export default async function GlobalNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations('nav');

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-white tracking-tight">
            CCKit
          </Link>
          <Link
            href="/explore"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('explore')}
          </Link>
          <Link
            href="/submit"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('submit')}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} logoutLabel={t('logout')} />
          ) : (
            <LoginButton label={t('login')} />
          )}
        </div>
      </div>
    </nav>
  );
}
