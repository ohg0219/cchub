import { createClient } from '@/lib/supabase/server';
import { LoginButton } from '@/components/login-button';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/');

  await searchParams; // resolve promise (next param reserved for future use)

  const t = await getTranslations('login');

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-8 text-center">
        <div className="mb-4 text-4xl">🔐</div>
        <h1 className="mb-2 text-xl font-bold text-white">{t('title')}</h1>
        <p className="mb-6 text-sm text-gray-400">{t('subtitle')}</p>
        <LoginButton label={t('button')} />
        <p className="mt-4 text-xs text-gray-500">{t('terms')}</p>
      </div>
    </main>
  );
}
