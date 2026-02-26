import { createClient } from '@/lib/supabase/server';
import { SubmitForm } from '@/components/submit-form';
import { getTranslations, getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function SubmitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/auth/login?next=/submit`);

  const t = await getTranslations('submit');

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-white">{t('title')}</h1>
      <p className="mb-8 text-sm text-gray-400">{t('subtitle')}</p>
      <SubmitForm userId={user.id} />
    </main>
  );
}
