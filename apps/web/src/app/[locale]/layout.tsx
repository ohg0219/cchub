import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import GlobalNav from '@/components/global-nav';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'CCHub — Claude Code Starter Kit Hub',
  description: 'Skills + Hooks + Agents + CLAUDE.md를 한 번에 설치하는 마켓플레이스',
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ko' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <NextIntlClientProvider messages={messages}>
          <GlobalNav />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
