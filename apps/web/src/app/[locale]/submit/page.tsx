import { SubmitForm } from '@/components/submit-form';
import { getTranslations } from 'next-intl/server';

export default async function SubmitPage() {
  const t = await getTranslations('submit');

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-white">{t('title')}</h1>
      <p className="mb-8 text-sm text-gray-400">{t('subtitle')}</p>
      <SubmitForm />
    </main>
  );
}
