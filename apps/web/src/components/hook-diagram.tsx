'use client';

import { useTranslations } from 'next-intl';
import type { HookMeta } from '@/lib/supabase/types';

const EVENT_ORDER = ['PreToolUse', 'PostToolUse', 'Notification', 'Stop'] as const;

const EVENT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  PreToolUse:   { label: 'PreToolUse',   color: 'text-blue-400',   bg: 'bg-blue-950' },
  PostToolUse:  { label: 'PostToolUse',  color: 'text-green-400',  bg: 'bg-green-950' },
  Notification: { label: 'Notification', color: 'text-yellow-400', bg: 'bg-yellow-950' },
  Stop:         { label: 'Stop',         color: 'text-red-400',    bg: 'bg-red-950' },
};

export function HookDiagram({ hooks }: { hooks: HookMeta[] }) {
  const t = useTranslations('kitDetail');
  const grouped = EVENT_ORDER.reduce<Record<string, HookMeta[]>>((acc, event) => {
    acc[event] = hooks.filter((h) => h.event === event);
    return acc;
  }, {} as Record<string, HookMeta[]>);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      {/* 흐름 헤더 */}
      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
        <span className="rounded bg-blue-950 px-2 py-0.5 text-blue-400">PreToolUse</span>
        <span>→</span>
        <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-300">Tool 실행</span>
        <span>→</span>
        <span className="rounded bg-green-950 px-2 py-0.5 text-green-400">PostToolUse</span>
      </div>

      <div className="flex flex-col gap-3">
        {EVENT_ORDER.map((event) => {
          const list = grouped[event];
          const style = EVENT_STYLES[event];
          return (
            <div key={event}>
              <p className={`mb-1 text-xs font-semibold ${style.color}`}>{style.label}</p>
              {list.length === 0 ? (
                <p className="pl-3 text-xs text-gray-600">{t('noHook')}</p>
              ) : (
                <ul className="flex flex-col gap-1 pl-3">
                  {list.map((h) => (
                    <li key={h.name} className={`rounded px-2 py-1 text-xs ${style.bg}`}>
                      <span className={`font-medium ${style.color}`}>{h.name}</span>
                      {h.matcher && (
                        <span className="ml-1 text-gray-500">({h.matcher})</span>
                      )}
                      <span className="ml-2 text-gray-400">{h.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
